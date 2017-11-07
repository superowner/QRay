var Shaders : Shaders;

var point : GameObject;
var normal : Vector3 = Vector3(0,1,0);  //up

function Start() {
	for(var i = 0; i < 200; i++) {
		Instantiate(point, Shaders.SampleHemisphereCap(normal, 180), Quaternion(0,0,0,0));
	}
}


function CosHemisphere(normal : Vector3) {  //Unoptimized.
	var r1 = Random.Range(0.00,1.00);
	var r2 = Random.Range(0.00,1.00);
	var theta = 2 * Mathf.PI * r1;
	var phi = Mathf.Acos(Mathf.Sqrt(r2));
	var vec = Vector3(Mathf.Cos(theta) * Mathf.Cos(phi), -Mathf.Sin(theta), Mathf.Cos(theta) * Mathf.Sin(phi));
	return vec * Vector3.Dot(vec, normal);
}

function SamReflectanceModel(normal : Vector3) { //Sam's bad reflectance model. No variance in roughness - fully diffuse.
	var v : Vector3 = Random.onUnitSphere;
	return v * Mathf.Sign(Vector3.Dot(v, normal));
}

function SampleHemisphereCap(normal : Vector3, angle : float) : Vector3 { //Whoop! This one works!
	angle /= 2;
	var targetDirection : Quaternion = Quaternion.LookRotation(normal, Vector3.up);
    var angleInRad = Random.Range(0.0,angle) * Mathf.Deg2Rad;
    var PointOnCircle = (Random.insideUnitCircle.normalized)*Mathf.Sin(angleInRad);
    var V = Vector3(PointOnCircle.x,PointOnCircle.y,Mathf.Cos(angleInRad));
    return targetDirection*V;
}