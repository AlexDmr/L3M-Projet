import * as NF from "@Services/cabinetMedicalService";
import {Component, OnInit} from "@angular/core";

const htmlTemplate = `
    <h1 alx-dragdrop>IHM de la secrétaire</h1>
    <p *ngIf="!initDone">CHARGEMENT...</p>
    <section *ngIf="initDone" class="cabinet">
        Mon beau cabinet médical
    </section>
    <p>à compléter...</p>
`;
@Component({
    selector	: "composant-secretaire",
    template	: htmlTemplate
})
export class ComposantSecretaire implements OnInit {
    initDone        : boolean = false;
    constructor		(public cms: NF.ServiceCabinetMedical) { // Ce composant dépend du service de cabinet médical
    }
    ngOnInit() {
        console.log("Appelez le service pour formatter et obtenir les données du cabinet\n", this);
        this.cms.getData( "/data/cabinetInfirmier.xml" ).then( (cabinet: NF.CabinetInterface) => {
            console.log( "\t=> cabinetJS:", cabinet );
            this.initDone = true;
        }, (err) => {console.error("Erreur lors du chargement du cabinet", "/data/cabinetInfirmier.xml", "\n", err);});
    }
}


