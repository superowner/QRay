//-------OBJECT PROPERTIES----------
var id : int;
var diffuse : Texture2D;
var normal : Texture2D;
var roughness : Texture2D;
var reflectance : Texture2D;
var transmission : Texture2D;
var ior : float;
var emittance : Texture2D;
var emittanceFac : float = 0;
//----------------------------------

//-----------DYNAMIC MATERIAL FORMAT------------------

var thisMaterial = new Mat("Default", new Texture2D[7], ["Albedo", "Normal", "Reflectance", "Transmission", "Roughness", "Metalness", "Emittance"], new float[2], ["Emittance Scale", "IOR"]);

class Mat {
	var name : String;
	var maps : Texture2D[];
	var mapNames : String[];
	var scalars : float[];
	var scalarNames : String[];
	public function Mat(n, m, mn, s, sn) {
		this.name = n;
		this.maps = m;
		this.mapNames = mn;
		this.scalars = s;
		this.scalarNames = sn;
	}
}
//	DYNAMIC / EXTENDABLE MATERIAL FORMAT:
//		MAPS: {albedo - 0}, {normal - 1}, {reflectance - 2}, {transmission - 3}, {roughness - 4}, {metalness - 5}, {emittance - 6}
//
//		SCALARS (and booleans): {emittanceScale - 0}, {ior - 1}

public function GetMaterial() {
	return thisMaterial;
}

public function SetMaterial(mat : Mat) {
	thisMaterial = mat;
}

