import {Injectable}     from "@angular/core";
import {Http, Response} from "@angular/http";
import "rxjs/add/operator/toPromise";

export enum sexeEnum {M, F}
export interface PatientInterface {
    prenom                  : string;
    nom                     : string;
    sexe                    : sexeEnum;
    numeroSecuriteSociale   : string;
    adresse                 : {
        ville       : string;
        codePostal  : number;
        rue         : string;
        numero      : string;
        etage       : string;
    };
}
export interface InfirmierInterface {
    id          : string;
    prenom      : string;
    nom         : string;
    photo       : string;
    patients    : PatientInterface[];
}
export interface CabinetInterface {
    infirmiers          : InfirmierInterface[];
    patientsNonAffectes : PatientInterface  [];
}

@Injectable()
export class ServiceCabinetMedical {
    constructor(private _http: Http) {} // Le service CabinetMedical a besoin du service Http
    getData( url: string ) : Promise<CabinetInterface> {
        return this._http.get(url).toPromise().then( (res: Response) => {
            let cabinet : CabinetInterface = {
                infirmiers          : [],
                patientsNonAffectes : []
            };

            return cabinet;
        }); // Fin de this._http.get
    }
}
