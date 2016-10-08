import { NgModule }                 from "@angular/core";
import { CommonModule }             from "@angular/common";

import {AlxDraggable, AlxDropzone, AlxDragDrop}  from "./DirectivesDragDrop";

@NgModule({
    imports     : [ CommonModule ],
    exports     : [ AlxDragDrop, AlxDraggable, AlxDropzone ],
    declarations: [ AlxDragDrop, AlxDraggable, AlxDropzone ],
    providers   : [ ],

})
export class DragDropModule { }
