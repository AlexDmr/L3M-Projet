import { NgModule }                 from "@angular/core";
import { CommonModule }             from "@angular/common";
import { FormsModule  }             from "@angular/forms";
import { DragDropModule }           from "./DragDrop/DragDropModule";
import { HttpModule }               from "@angular/http";

import { ComposantSecretaire }      from "./Components/ComposantSecretaire";
import { ServiceCabinetMedical }    from "@Services/cabinetMedicalService";

@NgModule({
    imports     : [ CommonModule, FormsModule, DragDropModule, HttpModule ],
    exports     : [ ComposantSecretaire ],
    declarations: [ ComposantSecretaire ],
    providers   : [ ServiceCabinetMedical ],

})
export class CabinetMedicalModule { }
