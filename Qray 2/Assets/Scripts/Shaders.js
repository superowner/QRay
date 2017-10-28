public class ShaderReturn {
	var ray : Ray;
	var color : Color;
	public function ShaderReturn(r, c) {
		this.ray = r;
		this.color = c;
	}
}

function SampleHemisphereCap(normal : Vector3, angle : float) : Vector3 { //Whoop! This one works!
	angle /= 2;
	var targetDirection : Quaternion = Quaternion.LookRotation(normal, Vector3.up);
    var angleInRad = Random.Range(0.0, angle) * Mathf.Deg2Rad;
    var PointOnCircle = (Random.insideUnitCircle.normalized) * Mathf.Sin(angleInRad);
    var V = Vector3(PointOnCircle.x, PointOnCircle.y, Mathf.Cos(angleInRad));
    return targetDirection * V;
}

public function BSDF(roughness : float, inRay : Vector3, normal : Vector3, reflectance : float, transmission : float) {  //Bidirectional Scatter Distribution Function.
	var rand = Random.Range(0.00, 1.00);
	var reflect : boolean =  reflectance > rand;
	if(reflect) {  //Reflect ray.
		normal = Vector3.Reflect(inRay, normal);
		if(roughness > 0) { return SampleHemisphereCap(normal, roughness * 180.0); } //Applies the roughness to the reflection normal.
		else { return normal; }  //So we don't waste compute power.
	}
	else {  //Transmit ray / diffuse it.
		//rand = Random.Range(0.00, 1.00);
		//var transmit = transmission > rand;
		//if(transmit) { return Refract(-normal, roughness * 180, ior); }
		//else {
		return SampleHemisphereCap(normal, 180);
		//}
	}
}  //Shader functions need to return a new ray and color;

function SSS(inRay : RaycastHit, normal : Vector3, color : Color, size : float) {
	var newPoint = inRay.point + SampleHemisphereCap(-normal, 90);
	//while() {
		//newPoint += Random.onUnitSphere * size;
	//}
}

public function EquirectangularMap(dir : Vector3) {
	// Convert (normalized) dir to spherical coordinates.	
	dir = Vector3.Normalize(dir);
	longlat = Vector2(Mathf.Atan2(dir.y, dir.x), Mathf.Acos(dir.z));
	// Normalize, and lookup in equirectangular map.
 	return Vector2(longlat.x / (2.0 * Mathf.PI), longlat.y / Mathf.PI);
}

public function EnvMapUV(dir : Vector3) {
	dir = Vector3.Normalize(dir);
	var u = Mathf.Atan2(dir.x, dir.z) / ((2 * Mathf.PI) + 0.5);
	var v = (-dir.y * 0.5) + 0.5;
	return Vector2(u, v);
}