const modal = new bootstrap.Modal(document.getElementById("errore"));

const RILEVA_IP = 0;
const STESSA_RETE = 1;
const FLSM = 2;
const VLSM = 3;

const IP = 0;
const SM = 1;
const GW = 2;
const SH = 3;
const EH = 4;
const BR = 5;
const ID = 6;

class Address{
    constructor(address) {
        this.addressIn = address;
        this.addressBin = new Array();
        this.addressDec = new Array();
    }
    checkAddress() {
        return (/^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\s){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/).test(this.addressIn);
    }
    setAddressBin(){
        if(this.checkAddress() == true){
            this.addressBin =  this.addressIn.split(" ").map(ottetto => "00000000".slice(parseInt(ottetto).toString(2).length) + parseInt(ottetto).toString(2));
        }
    }
    setAddressDec(){
        if(this.checkAddress() == true)this.addressDec = this.addressIn.split(" ").map(Number);
    }
    getAddressBin(){
        if(this.checkAddress() == true){
            this.setAddressBin();
            return this.addressBin; }
    }
    getAddressDec(){
        if(this.checkAddress() == true){
            this.setAddressDec();
            return  this.addressDec;
        }
    }
    getOttettoBin(i){
        if(this.checkAddress() == true){
            this.setAddressBin();
            return this.addressBin[i];
        }
    }
    getOttettoDec(i){
        if(this.checkAddress() == true){
            this.setAddressDec();
            return this.addressDec[i];
        } 
    }
    setAddress(address){  
        this.addressIn = address;
    }

    getAddress(){
        if(this.checkAddress() == true){
            return this.addressIn;
        } 
    }
}
class Ip extends Address{
    constructor(ip){super(ip);}
    getTipo(){
        if (parseInt(super.getOttettoDec(0)) == 10  //da 10.0.0.0 a 10.255.255.255
        || (parseInt(super.getOttettoDec(0)) == 172 && (parseInt(super.getOttettoDec(1)) >= 16 && parseInt(super.getOttettoDec(1)) <= 31))//da 172.16.0.0 a 172.31.255.255
        || (parseInt(super.getOttettoDec(0))) == 192 && parseInt(super.getOttettoDec(1)) == 168) return "privato";//tutti quelli dal primo ottetto pari a 192 o 168
        else return "pubblico";
   
    }
    getClasse(){
        if(super.checkAddress() == true){
            const classi = ["A", "B", "C", "D", "E"];
            //A: 1 - 127 = 128 indirizzi
            //B: 128 - 191 = 64 indirizzi
            //C: 192 - 223 = 32 indirizzi
            //D: 224 - 239 = 16 indirizzi
            //E: 240 - 255 = 16 indirizzi
            for(let i = 0; i < 4; i ++)if (super.getOttettoBin(0).charAt(i) == 0)return classi[i];
        }
    }
    getBitClasse(){
        //A: 8 bit
        //B: 16 bit
        //C: 24 bit
        
        if(super.checkAddress() == true)for(let i = 0; i < 3; i ++) if (super.getOttettoBin(0).charAt(i) == 0) return 8*(i+1);
    }
}
class Sm extends Address{
    constructor(sm){super(sm);}
    checkSm(){
        if (super.checkAddress() == false)return false;
        let k = -1
        if(this.getOttettoBin(0).charAt(0) == "0")return false
        for( let i = 0; i < 4; i++)
            for( let j = 0; j < 8; j++){
                if(this.getOttettoBin(i).charAt(j) == "0" && k == -1)k = i;
                if(this.getOttettoBin(i).charAt(j) == "1" && k != -1)return false
            }
        return true;
    }
}
class SuperAddress extends Address{
    constructor(ip,sm){
        super();
        this.ip = new Ip(ip);
        this.sm = new Sm(sm);
    }
    checkInput(){
        if(this.ip.checkAddress() == true && this.sm.checkSm() == true)return true;
        else return false;
    }
    setAddress(address){
        super.setAddress(address);
    }
}
class NetId extends SuperAddress{
    constructor(ip,sm){
        super(ip,sm);
        this.setAddress();
    }
    setAddress(){
        if(super.checkInput() == true){
            let netId = ["","","",""];
            for (let i = 0; i < 4; i++) for (let j = 0; j < 8; j++) netId[i] += (this.ip.getOttettoBin(i).charAt(j) & this.sm.getOttettoBin(i).charAt(j));
            super.setAddress(netId.map(ottetto => parseInt(ottetto, 2)).join(" "));
        }
    }
}
class IpSubnet extends Address{
    constructor(ip,rete,maxReti){
        super();
        this.ip = new Ip(ip);
        this.rete = rete.toString(2);
        this.maxReti = maxReti;
        this.setAddress();
    }
    setAddress(){
        if(this.ip.checkAddress() == true){
            let ipSubnet = ""
            ipSubnet = this.ip.getAddressBin().join("").substring(0, this.ip.getBitClasse());
            ipSubnet += (this.rete .length < this.maxReti ? "0".repeat(this.maxReti -  this.rete .length) +  this.rete  :  this.rete ) + "0".repeat(32 - ipSubnet.length);
            super.setAddress(ipSubnet.replace(/(.{8})/g, "$1 ").trim().substring(0,35).split(" ").map(ottetto => parseInt(ottetto, 2)).join(" "));
        }
    }
}
class SmSubnet extends Address{
    constructor(bitSm){
        super();
        this.bitSm = bitSm;
        this.setAddress();
  
    }
    setAddress(){
        let sm = [0, 0, 0, 0];
        let i = 0;
        while (this.bitSm > 0) {
            if (this.bitSm >= 8) {
                sm[i] = 255;
                this.bitSm -= 8;
            } else {
                sm[i] = (1 << this.bitSm) - 1 << (8 - this.bitSm);
                break;
            }
            i++;
        }
        super.setAddress(sm.join(" "));
    }
}
class Broadcast extends SuperAddress{
    constructor(ip,sm){
        super(ip,sm);
        this.setAddress();
    }
    setAddress(){

        if(super.checkInput() == true){
            let broadcast = ["","","",""];
            for (let i = 0; i < 4; i++) {
                for (let j = 0; j < 8; j++) {
                    if (this.sm.getOttettoBin(i).charAt(j) == 1) broadcast[i] += this.ip.getOttettoBin(i).charAt(j)
                    else broadcast[i] += "1"
                }
            }
            for (let i = 0; i < 4; i++)while (broadcast[i].length < 8)broadcast[i] = "0" + broadcast[i]
            super.setAddress(broadcast.map(ottetto => parseInt(ottetto, 2)).join(" "));
        }
    }
}
class Gateway extends SuperAddress{
    constructor(ip,sm){
        super(ip,sm);
        this.netId = new NetId(ip,sm)
        this.setAddress();
    }
    setAddress(){
        if(super.checkInput() == true){
            let gateway = ["","","",""];
            for (let i = 0; i < 4; i++)gateway[i] = this.netId.getOttettoBin(i);
            gateway[3] = gateway[3].substring(0, 7) + "1"
            super.setAddress(gateway.map(ottetto => parseInt(ottetto, 2)).join(" "));
        }
    }
}
class StartHost extends SuperAddress{
    constructor(ip,sm){
        super(ip,sm);
        this.netId = new NetId(ip,sm)
        this.setAddress();
    }
    setAddress(){
        if(super.checkInput() == true){
            let startHost = ["","","",""];
            for (let i = 0; i < 4; i++)startHost[i] = this.netId.getOttettoBin(i);
            startHost[3] = startHost[3].substring(0, 6) + "10"
            super.setAddress(startHost.map(ottetto => parseInt(ottetto, 2)).join(" "));
        }
    }
}
class EndHost extends SuperAddress{
    constructor(ip,sm){
        super(ip,sm);
        this.broadcast = new Broadcast(ip,sm)
        this.setAddress();
    }
    setAddress(){
        if(super.checkInput() == true){
            let endHost = ["","","",""];
            for (let i = 0; i < 4; i++)endHost[i] = this.broadcast.getOttettoBin(i);
            endHost[3] = endHost[3].substring(0, 7) + "0"
            super.setAddress(endHost.map(ottetto => parseInt(ottetto, 2)).join(" "));
        }
    }
}
class StessaRete{
    constructor(ip1,sm1,ip2,sm2){
        this.netId = [];
        this.netId.push(new NetId(ip1,sm1));
        this.netId.push(new NetId(ip2,sm2));
    }

    checkInput(){
        if(this.netId[0].checkInput() == true &&  this.netId[1].checkInput() == true)return true;
        else return false;
    }

    getStessaRete(){
        if(this.checkInput() == true){
            if (this.netId[0].getAddress() == this.netId[1].getAddress() )return "stessa";
            else return "diversa";
        }
    }
    getAddress(i){
        return this.netId[i].getAddress();
    }


}
class MascheraFissa{
    constructor(ip,numReti){
        this.numReti = numReti;
        this.ip = new Ip(ip);
        this.reti = new Array(); 
    }
    getMaxReti(){return Math.ceil(Math.log2(this.numReti));}
    getRetiPossibili(){ return Math.pow(2,this.getMaxReti()); }
    getRetiAvanzate(){return this.getRetiPossibili() - this.numReti;}
    checkSottoreti(){
        //numero sottoreti - 3 (gateway,broadcast,netId)
        if(this.ip.checkAddress() == true){
            const classi = ["A", "B", "C"];
            if(this.numReti  == 0)return false;
            for(let i = 0; i < 3; i++)if( this.ip.getClasse() == classi[i] && this.numReti >= Math.pow(2,24 - (8*i)) - 3)return false;
            return true;
        }
    }
    checkInput(){
        if(this.ip.checkAddress() == true && this.checkSottoreti() == true)return true;
        else return false;
    }
    setSubnetting(){
        if(this.checkInput() == true){
            for(let i = 0; i < this.numReti; i ++){
                this.reti[i] = new Array(); 
                this.reti[i][IP] = new IpSubnet(this.ip.getAddress(),i,this.getMaxReti());
                this.reti[i][SM] = new SmSubnet(this.ip.getBitClasse() + this.getMaxReti());
                this.reti[i][ID] = new NetId(this.reti[i][IP].getAddress(),this.reti[i][SM].getAddress());
                this.reti[i][GW] = new Gateway(this.reti[i][IP].getAddress(),this.reti[i][SM].getAddress());
                this.reti[i][SH] = new StartHost(this.reti[i][IP].getAddress(),this.reti[i][SM].getAddress());
                this.reti[i][EH] = new EndHost(this.reti[i][IP].getAddress(),this.reti[i][SM].getAddress());
                this.reti[i][BR] = new Broadcast(this.reti[i][IP].getAddress(),this.reti[i][SM].getAddress());
            }
        }
    }
    getAddress(i,tipo){
        if(this.checkInput() == true){
            return this.reti[i][tipo].getAddress();   
        }
    }
}

class MascheraVariabile{

}

class Subnetting{



}

class Esercizio{
    constructor (nome,input,short){
        this.nome = nome;
        this.input =  input.split(";");
        this.short = short;
    }
    getNome(){return this.nome;}
    getShort(){return this.short;}
    getInput(i){return this.input[i];}
    getNumeroInput(){return this.input.length;}
}


const esercizi  = [];
const select = document.getElementById("choice");
var selected = 0;


esercizi.push(new Esercizio("Scopri tipo e classe di un IP","Indirizzo IP:","Analisi IP"));
esercizi.push(new Esercizio("Scopri se stessa rete tra IP","Indirizzo IP.1:;Subnetmask SM.1:;Indirizzo IP.2:;Subnetmask SM.2:","Stessa rete"));
esercizi.push(new Esercizio("Subnetting a maschera fissa","Indirizzo IP:;Numero sottoreti:","FLSM"));
esercizi.push(new Esercizio("Subnetting a maschera variabile","Indirizzo IP:;Numero sottoreti:","VLSM"));

function init(){
    initChoice();
    initInput();
}

function initChoice(){
    let choice = "";
    let selected = "selected";
    for(let i = 0; i < esercizi.length; i ++){
        choice += "<option " + selected + " value='"+ i+"'>"+ esercizi[i].getNome()+"</option>";
        selected = " ";
    }
    document.getElementById("choice").innerHTML = choice;
}

function initInput(){
    let input = "";
    let placeholder = "255 255 255 255";
    refresh();
    for(let i = 0; i < esercizi[selected].getNumeroInput(); i ++){
        input += "<div class='mb-3'>";
        input += "<label  class='form-label fs-6 fw-light' ><small>" + esercizi[selected].getInput(i) +"</small></label>";
        if(esercizi[selected].getInput(i) == "Numero sottoreti:")placeholder = "69";
        input += "<input type='text' class='form-control 'placeholder='"+placeholder+"' ></input>";
        if(selected == VLSM && esercizi[selected].getInput(i) == "Numero sottoreti:")input += "<div  id='sottoretiHelp' class='form-text d-block'>A campo riempito comparsa menu degli host per sottorete</div>";
        input += "</div>";
    }
    input += "<div id='extraInput' class='overflow-auto ps-3 pe-3 pt-1 mb-4 mt-4 m-auto bg-light border rounded-1 d-none' style='max-height:230px;'></div>";
    document.getElementById("input").innerHTML = input;
    if(selected == VLSM)initExtraInput();
}

function initExtraInput(){
    const inputElements = document.getElementsByClassName("form-control");
    const lastInputElement = inputElements[1];
    let input = 0;
    let displayOn = "d-block";
    let displayOff = "d-none";
    lastInputElement.addEventListener("input", function() {
        if (lastInputElement.value && check() == true) {
            input = "";
            if(lastInputElement.value > 2){
                input += "<div class='text-center'>";
                input += "<p class='m-0 p-0'>scorrere</p>";
                input += "<svg class='m-0 p-0' xmlns='http://www.w3.org/2000/svg' width='30' height='30' fill='currentColor' class='bi bi-caret-down' viewBox='0 0 16 16'>";
                input += "<path d='M3.204 5h9.592L8 10.481 3.204 5zm-.753.659 4.796 5.48a1 1 0 0 0 1.506 0l4.796-5.48c.566-.647.106-1.659-.753-1.659H3.204a1 1 0 0 0-.753 1.659z'/>";
                input += "</svg>";
                input += "</div>";
            }
            for(let i = 0; i < lastInputElement.value; i ++){
                input += "<div class='mb-3'>"
                input += "<label  class='form-label fs-6 fw-light' ><small>Numero host sottorete N." + (i+ 1) +":</small></label>";
                input += "<input type='text' class='form-control 'placeholder='69' ></input>";
                input += "</div>";
            }
            displayOn = "d-block";
            displayOff = "d-none";  
        }
        else{
            input = "";
            displayOn = "d-none";
            displayOff = "d-block";
        }
        document.getElementById("extraInput").innerHTML = input;
        document.getElementById("extraInput").classList.add(displayOn);
        document.getElementById("sottoretiHelp").classList.add(displayOff);
        document.getElementById("sottoretiHelp").classList.remove(displayOn);
        document.getElementById("extraInput").classList.remove(displayOff);
    });
}

function check(){
    return true;
}

function refresh(){selected = select.options[select.selectedIndex].value;}


function load(){
    let input = document.getElementsByTagName("input");
    let check = true;
    let output = "";
    switch(parseInt(selected)){
        case RILEVA_IP:
            let rilveIp = new Ip(input[0].value);
            check = rilveIp.checkAddress();
            if(check == true){
                output += "<table class='table table-bordered'>"
                output += "<thead class='table-light'>"
                output += "<tr>"
                output += "<td>IP</td>"
                output += "<td>Classe</td>"
                output += "<td>Tipo</td>"
                output += "</tr>"
                output += "</thead>"
                output += "<tbody>"
                output += "<tr class='fw-light'>"
                output += "<td >"+ rilveIp.getAddress() +"</td>"
                output += "<td>" + rilveIp.getClasse() +"</td>"
                output += "<td>"+ rilveIp.getTipo()+"</td>"
                output += "</tr>"
                output += "</tbody>"
                output += "</table>"
            }
            break;
        case STESSA_RETE:
            let stessaRete = new StessaRete(input[0].value,input[1].value,input[2].value,input[3].value);
            check = stessaRete.checkInput();
            if(check == true){
                output = "<div class='table-responsive'>"
                output += "<table class='table table-bordered' style='min-width:580px'>"
                output += "<thead class='table-light'>"
                output += "<tr>"
                output += "<td>IP</td>"
                output += "<td>Subnetmask</td>"
                output += "<td>Net Id</td>"
                output += "<td>Rete</td>"
                output += "</tr>"
                output += "</thead>"
                output += "<tbody class='fw-light'>"
                output += "<tr>"
                output += "<td >"+ input[0].value +"</td>"
                output += "<td >" +  input[1].value +"</td>"
                output += "<td >"+ stessaRete.getAddress(0) +"</td>"
                output += "<td rowspan='2' class=' text-center align-middle'>"+ stessaRete.getStessaRete()+"</td>"
                output += "</tr>"
                output += "<tr>"
                output += "<td >"+ input[2].value +"</td>"
                output += "<td >" +  input[3].value +"</td>"
                output += "<td >"+ stessaRete.getAddress(1) +"</td>"
                output += "</tr>"
                output += "</tbody>"
                output += "</table>"
                output += "</div>"
            }
            break;
        case FLSM:
            let mascheraFissa = new MascheraFissa(input[0].value,input[1].value);
            check = mascheraFissa.checkInput();
            if(check == true){
                mascheraFissa.setSubnetting();
                output = "<div class='table-responsive'style='max-height:570px; overflow-y:auto;'>"
                output += "<table class='table table-bordered table-hover' style='min-width:900px;'>"
                output += "<thead class='table-light'>"
                output += "<tr>"
                output += "<td class='text-center'>#</td>"
                output += "<td >IP</td>"
                output += "<td >Net Id</td>"
                output += "<td>Gateway</td>"
                output += "<td >Primo host</td>"
                output += "<td >Ultimo host</td>"
                output += "<td >Broadcast</td>"
                output += "<td>Subnetmask</td>"
                output += "</tr>"
                output += "</thead>"
                output += "<tbody class='fw-light'>"
                for(let i= 0; i < input[1].value; i ++){
                    output += "<tr>"
                    output += "<td class='text-center'>" + (i + 1)+"</td>"
                    output += "<td >" + mascheraFissa.getAddress(i,IP)+"</td>"
                    output += "<td >" + mascheraFissa.getAddress(i,ID)+"</td>"
                    output += "<td >" + mascheraFissa.getAddress(i,GW)+"</td>"
                    output += "<td >" + mascheraFissa.getAddress(i,SH)+"</td>"
                    output += "<td >" + mascheraFissa.getAddress(i,EH)+"</td>"
                    output += "<td >" + mascheraFissa.getAddress(i,BR)+"</td>"
                    output += "<td >" + mascheraFissa.getAddress(i,SM)+"</td>"
                    output += "</tr>"
                }

                output += "</tbody>"
                output += "</table>"
                output += "</div>"
            }
            break;
        case VLSM:
            alert("in progress...")
            break;

    }
    if(check == true){
        document.getElementById("output").innerHTML = output;
        document.getElementById("select").innerHTML = "<mark class='mb-3 p-1 pe-2 ps-2 rounded-1 ' style='background-color:rgb(236,255,250)'>" + esercizi[parseInt(selected)].getShort()+"</mark>"
    
    }
    else  modal.show();
  
}




