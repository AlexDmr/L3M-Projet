import {Directive, ElementRef, Input, HostListener, EventEmitter, Output} from "@angular/core";
import {myDoc} from "./DragDropUtils";

/* Polyfill TouchEvent */
interface MyTouchEvent extends TouchEvent {};
/*
interface ShadowRoot extends DocumentFragment {
    styleSheets     : StyleSheetList;
    innerHTML       : string;
    host            : Element;
    activeElement   : Element;
    elementFromPoint        (x : number, y : number) : Element;
    elementsFromPoint       (x : number, y : number) : Element[];
    caretPositionFromPoint  (x : number, y : number); // => CaretPosition
};

interface ElementWithShadowRoot extends HTMLElement {
    shadowRoot  : ShadowRoot;
};*/

class DragManager {
    draggedStructures   = new Map<string, AlxDraggable>();
    dropZones           = new Map<Element, AlxDropzone >();
    //constructor() {}
    public startDrag(idPointer: string, dragged: AlxDraggable) : Map<Element, AlxDropzone> {
        this.draggedStructures.set(idPointer, dragged);
        let possibleDropZones = new Map<Element, AlxDropzone>();
        this.dropZones.forEach( dz => {
            if( dz.checkAccept(dragged) ) {
                dz.appendDropCandidatePointer( idPointer );
                possibleDropZones.set(dz.root, dz);
            }
        } );
        return possibleDropZones;
    }
    public isAssociatedToDropZone(element: Element) : boolean {
        return this.dropZones.has( element );
    }
    public registerDropZone( dropzone: AlxDropzone ) {
        this.dropZones.set(dropzone.root, dropzone);
    }
    public unregisterDropZone( dropzone: AlxDropzone ) {
        this.dropZones.delete(dropzone.root);
    }
    public pointerMove(idPointer: string, x: number, y: number) : boolean {
        let dragged = this.draggedStructures.get(idPointer);
        if(dragged) {
            dragged.move(x, y);
        }
        return dragged !== undefined;
    }
    public pointerRelease(idPointer: string) : boolean {
        let dragged = this.draggedStructures.get(idPointer);
        if(dragged) {
            dragged.stop();
            this.draggedStructures.delete(idPointer);
        }
        return dragged !== undefined;
    }
};
let DM = new DragManager();

let dragDropInit = false;
@Directive({
    selector: "*[alx-dragdrop]"
})
export class AlxDragDrop {
    constructor() {
        if(dragDropInit) {
            console.error( "Do not create multiple instance of directive alx-dragdrop !" );
        } else {
            console.log( "AlxDragDrop enabled !");
            dragDropInit = true;
        }
    }
    @HostListener( "document: mousemove", ["$event"] ) mousemove( e ) {
        DM.pointerMove   ("mouse", e.clientX, e.clientY);
    }
    @HostListener( "document: mouseup"  , ["$event"] ) mouseup  ( e ) {
        DM.pointerRelease("mouse");
    }
    @HostListener( "document: touchmove", ["$event"] ) touchmove( e ) {
        for (let i = 0; i < e.changedTouches.length; i++) {
            let touch:Touch = e.changedTouches.item(i);
            if (DM.pointerMove(touch.identifier.toString(), touch.clientX, touch.clientY)) {
                e.preventDefault();
                e.stopPropagation();
            }
        }
    }
    @HostListener( "document: touchend" , ["$event"] ) touchend ( e ) {
        for(let i=0; i<e.changedTouches.length; i++) {
            let touch : Touch = e.changedTouches.item(i);
            if( DM.pointerRelease(touch.identifier.toString()) ) {
                e.preventDefault();
                e.stopPropagation();
            }
        }
    }
}

@Directive({
    selector: "*[alx-draggable]"
})
export class AlxDraggable {
    @Input("alx-draggable") data: any;
    private isBeingDragged : boolean = false;
    private cloneNode   : HTMLElement = null;
    private possibleDropZones = new Map<Element, AlxDropzone>();
    private currentDropZone : AlxDropzone;
    private dx : number;
    private dy : number;
    private ox : number;
    private oy : number;
    private tx : number;
    private ty : number;
    private idPointer : string;
    private root : HTMLElement;
    constructor(el: ElementRef) {
        this.root = el.nativeElement;
        if(!dragDropInit) {
           console.error("You should add one alx-dragdrop attribute to your code before using alx-draggable");
        }
        //console.log( "new instance of AlxDraggable", this );
    }
    ngOnDestroy() {
        this.stop();
    }
    @HostListener("mousedown" , ["$event"]) onMouseDown (event : MouseEvent) {
        //console.log("mousedown on", this, event);
        event.preventDefault();
        event.stopPropagation();
        this.start("mouse", event.clientX, event.clientY);
    }
    @HostListener("touchstart", ["$event"]) onTouchStart(event: MyTouchEvent) {
        //console.log("touchstart on", this);
        event.preventDefault();
        event.stopPropagation();
        for(let i=0; i<event.changedTouches.length; i++) {
            let touch : Touch = event.changedTouches.item(i);
            this.start(touch.identifier.toString(), touch.clientX, touch.clientY);
        }
    }
    start(idPointer: string, x: number, y: number) {
        if( !this.isBeingDragged ) {
            this.isBeingDragged = true;
            this.idPointer = idPointer;
            let bbox = this.root.getBoundingClientRect();
            this.ox = x; this.oy = y;
            this.dx = x - Math.round(bbox.left + window.pageXOffset);
            this.dy = y - Math.round(bbox.top  + window.pageYOffset);
            this.tx = bbox.width;
            this.ty = bbox.height;// console.log( "drag", this.tx, bbox.right - bbox.left );
            this.possibleDropZones = DM.startDrag(idPointer, this);
        }
    }
    stop() {
        this.isBeingDragged = false;
        if(this.cloneNode) {
            if(this.cloneNode.parentNode) {
                this.cloneNode.parentNode.removeChild(this.cloneNode);
            }
            this.cloneNode = null;
        }
        this.possibleDropZones.forEach( dz => {
            dz.removeDropCandidatePointer   (this.idPointer);
            dz.removePointerHover           (this.idPointer);
        } );
        this.possibleDropZones.clear();
        this.idPointer = null;
        if(this.currentDropZone) {
            this.currentDropZone.drop( this.data );
        }
        this.currentDropZone = null;
    }
    move(x: number, y: number) : this {
        let element : Element = null;
        if(this.cloneNode === null) {
            //if( Math.abs(x-this.ox) + Math.abs(y-this.oy) > 50 ) {
                this.getClone();
            //}
        }
        if(this.cloneNode) {
            this.cloneNode.style.left = (x - this.dx) + "px";
            this.cloneNode.style.top  = (y - this.dy) + "px";
            let visibility = this.cloneNode.style.visibility;
            this.cloneNode.style.visibility = "hidden";
            // let L = <Array<Element>>myDoc.elementsFromPoint(x-window.pageXOffset, y-window.pageYOffset);
            element = myDoc.elementFromPoint(x-window.pageXOffset, y-window.pageYOffset);
            //console.log( "element", element );
            this.cloneNode.style.visibility = visibility;
            this.possibleDropZones.forEach( dz => dz.removePointerHover(this.idPointer) );
            while(element) {
                // Check if we are on top of a dropZone
                this.currentDropZone = this.possibleDropZones.get( element );
                if(this.currentDropZone) {
                    this.currentDropZone.appendPointerHover( this.idPointer );
                    break;
                }
                element = <Element>element.parentElement;
            }
        }
        return this;
    }
    getClone() : Node {
        if(this.cloneNode === null) {
            this.cloneNode = <HTMLElement>this.root.cloneNode(true);
            document.body.appendChild( this.cloneNode );
            this.cloneNode.style.position   = "absolute";
            this.cloneNode.style.zIndex     = "999";
            this.cloneNode.classList.add( "alx-cloneNode" );
        }
        return this.cloneNode;
    }
}

// function noAcceptFct(draggedData) {return false;}
function YES(data) {return true;}
@Directive({ selector: "*[alx-dropzone]" })
export class AlxDropzone {
    public root : HTMLElement;
    @Input("alx-accept-fct")    acceptFct : Function; // = (data) => true;
    @Input("alx-dragstart-css") dragStartCSS : string;
    @Input("alx-draghover-css") dragHoverCSS : string;
    @Output("alx-ondrop")       onDropEmitter = new EventEmitter();

    // CSS when canDrop and startdraggable
    private dropCandidateofPointers : Array<string> = [];
    private pointersHover           : Array<string> = [];
    constructor(el: ElementRef) {
        if(!dragDropInit) {
            console.error("You should add one alx-dragdrop attribute to your code before using alx-dropzone");
        }
        this.root = el.nativeElement;
        this.acceptFct = YES;
        DM.registerDropZone(this);
    }
    drop( obj ) {
        console.log( this, "drop", obj );
        this.onDropEmitter.emit( obj );
    }
    checkAccept(drag: AlxDraggable) : boolean {
        let res = this.acceptFct( drag.data );
        return res;
    }
    appendPointerHover( idPointer: string ) {
        if( this.pointersHover.indexOf(idPointer) === -1 ) {
            this.pointersHover.push(idPointer);
            if(this.dragHoverCSS) {
                this.root.classList.add( this.dragHoverCSS );
            }
        }
    }
    removePointerHover( idPointer: string ) {
        let pos = this.pointersHover.indexOf(idPointer);
        if( pos >= 0 ) {
            this.pointersHover.splice(pos, 1);
            if(this.pointersHover.length === 0 && this.dragHoverCSS) {
                this.root.classList.remove( this.dragHoverCSS );
            }
        }
    }
    appendDropCandidatePointer( idPointer: string ) {
        //console.log( "appendDropCandidatePointer", idPointer, this );
        if( this.dropCandidateofPointers.indexOf(idPointer) === -1 ) {
            this.dropCandidateofPointers.push( idPointer );
            //console.log( "\tadd class", this.dragStartCSS );
            if(this.dragStartCSS) {
                this.root.classList.add( this.dragStartCSS );
            }
        }
    }
    removeDropCandidatePointer( idPointer: string ) {
        let pos = this.dropCandidateofPointers.indexOf(idPointer);
        if( pos >= 0 ) {
            this.dropCandidateofPointers.splice(pos, 1);
            if(this.dropCandidateofPointers.length === 0 && this.dragStartCSS) {
                this.root.classList.remove( this.dragStartCSS );
            }
        }
    }
    ngOnInit() {
        //console.log( "Init dropzone", this.dragStartCSS, this );
        //this.root.style
    }
}
