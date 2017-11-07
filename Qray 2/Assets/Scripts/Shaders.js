public class ShaderReturn {
	var dir : Vector3;
	var color : Color;
	var weight : float;
	public function ShaderReturn(d, c, w) {
		this.dir = d;
		this.color = c;
		this.weight = w;
	}
}

public function BSDF(diffuse : Color, roughness : float, inRay : Vector3, normal : Vector3, reflectance : float, transmission : float, normalColor : Color) {  //Bidirectional Scatter Distribution Function.
	normal = NormalToDir(normal, normalColor);  //The geometry normal is now adjusted to the normal image map.
	var rand = Random.Range(0.00, 1.00);
	var reflect : boolean =  reflectance > rand;
	if(reflect) {  //Reflect ray.
		if(roughness == 1) { return ShaderReturn(SampleHemisphereCap(normal, 180), diffuse, 1); }
		normal = Vector3.Reflect(inRay, normal);
		if(roughness > 0) { return ShaderReturn(SampleHemisphereCap(normal, roughness * 180.0), diffuse, 1); } //Applies the roughness to the reflection normal.
		else { return ShaderReturn(normal, diffuse, 1.0); }  //So we don't waste compute power.
	}
	else {  //Transmit ray / diffuse it.
		//rand = Random.Range(0.00, 1.00);
		//var transmit = transmission > rand;
		//if(transmit) { 
		return ShaderReturn(Refract(inRay, normal, 1.5), Color.white * 3, 1);
		//}
		//return ShaderReturn(SampleHemisphereCap(normal, 180), diffuse, 1);
	}
}

function Refract(i : Vector3, n : Vector3, ior : float) {
	i = Vector3.Normalize(i);
	n = Vector3.Normalize(n);
	if(Vector3.Dot(n, i) > 0) {
			n = -n;
			ior = 1.0 / ior;
	}
	ior = 1.0 / ior;
	var cost1 : float = Vector3.Dot(n, i) * -1;
	var cost2 : float = 1.0 - ior * ior * (1.0 - cost1 * cost1);
	if(cost2 > 0) {
		i = Vector3.Normalize((i * ior) + (n * (ior * cost1 - Mathf.Sqrt(cost2))));
		return i;
	}
}

function SSS(inRay : RaycastHit, normal : Vector3, color : Color, size : float) {
	var newPoint = inRay.point + SampleHemisphereCap(-normal, 90);
	//while(IsInside(inRay.gameObject.GetComponent.<Collider>(), newPoint)) {
		np = newPoint + Random.onUnitSphere * size;
		newPoint = np;
		r = Ray(np, np - newPoint);
	//}
	return ShaderReturn(r.direction, color, 1.0);
}



//NON-SHADER FUNCTIONS-------------------------------------------------
function SampleHemisphereCap(normal : Vector3, angle : float) : Vector3 { //Whoop! This one works!
	angle /= 2;
	var targetDirection : Quaternion = Quaternion.LookRotation(normal, Vector3.up);
    var angleInRad = Random.Range(0.0, angle) * Mathf.Deg2Rad;
    var PointOnCircle = (Random.insideUnitCircle.normalized) * Mathf.Sin(angleInRad);
    var v = Vector3(PointOnCircle.x, PointOnCircle.y, Mathf.Cos(angleInRad));
    return targetDirection * v;
}

function NormalToDir(surfaceNormal : Vector3, col : Color) {  //Normal ray generation for OpenGL normal maps.
	var targetDirection : Quaternion = Quaternion.LookRotation(surfaceNormal, Vector3(0,1,0));
	//var v = Vector3((col.r * 2) - 1, (col.g * 2) - 1, (col.b * 2) - 1);
	var c : Color = (col * 2) - Color.white;
	var v = Vector3(c.r, c.g, c.b);
	return targetDirection * v;
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

function IsInside(coll : Collider, point : Vector3) {
    var center : Vector3;
    var direction : Vector3;
    var ray : Ray;
    var hitInfo : RaycastHit;
    var hit : boolean;
 
    // Use collider bounds to get the center of the collider. May be inaccurate
    // for some colliders (i.e. MeshCollider with a 'plane' mesh)
    center = coll.bounds.center;
 
    // Cast a ray from point to center
    direction = center - point;
    ray = new Ray(point, direction);
    hit = coll.Raycast(ray, hitInfo, direction.magnitude);
 
    // If we hit the collider, point is outside. So we return !hit
    return !hit;
 }

function SchlickApproximate(ray : Vector3, normal : Vector3, ior : float) {
	var theta = Vector3.Angle(ray, normal);
	var r = Mathf.Pow((1 - ior) / (1 + ior), 2);  //'1' is the first medium ior, for now will stay as 1 (vacuum ior). 'ior' is the new medium ior.
	return r + Mathf.Pow((1 - r) * (1 - Mathf.Cos(theta)), 5);  //Returns the reflection probability (approximation).
}

function SchlitApproximate(dir : Vector3, normal : Vector3) {  //Debug test.
	var bias : float = 0;
	var scale : float = 1;
	var power : int = 5;
	return Mathf.Max(0, 1, bias + (scale * Mathf.Pow(1.0 + Vector3.Dot(dir, normal), power)));
}

function FullDiffuseReflectanceModel(normal : Vector3) { //No variance in roughness - fully diffuse.
	var v : Vector3 = Random.onUnitSphere;
	return v * Mathf.Sign(Vector3.Dot(v, normal));
}

function SphereToCart(theta : float, phi : float) {
	var xTheta = Mathf.Cos(theta);
	var yTheta = Mathf.Sin(theta);
	var xPhi = Mathf.Cos(phi);
	var yPhi = Mathf.Sin(phi);
	return Vector3(xTheta * xPhi, yTheta * xPhi, yPhi);
}

function CartToAzimuth(v : Vector3) {
	return Mathf.Acos(v.y / v.magnitude);
}

public function AcceptanceRatio(s1 : Color, s2 : Color) : float {
	return Mathf.Min(1, ColorDifference(s1, s2));
}

public function ColorDifference(c1 : Color, c2 : Color) {
	return Vector3(c2.r - c1.r, c2.g - c1.g, c2.b - c1.b).magnitude;
}