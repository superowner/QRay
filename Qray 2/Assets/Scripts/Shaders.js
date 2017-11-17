public class ShaderReturn {
	var direction : Vector3;
	var origin : Vector3;
	var color : Color;
	var weight : float;
	public function ShaderReturn(d, o, c, w) {
		this.direction = d;
		this.origin = o;
		this.color = c;
		this.weight = w;
	}
}

//---------------------PROBABLISTIC SHADER DETERMINATION FUNCTION----------------------
public function BSDF(diffuse : Color, roughness : float, inRay : Vector3, hit : RaycastHit, reflectance : float, transmission : float, normalColor : Color, metallic : float, ior : float) {  //Bidirectional Scatter Distribution Function.
	normal = NormalToDir(hit.SmoothedNormalCached(), normalColor);  //The geometry normal is now adjusted to the normal image map.
	normal = normal.normalized;
	inRay = inRay.normalized;
	var rand = Random.value;
	reflectance += Fresnel(inRay, normal, 1, ior);
	var reflect : boolean =  reflectance >= rand;
	if(reflect) {  //Reflect ray.
		if(roughness == 1) { return Diffuse(normal, hit, diffuse); }  //Roughness of 1 is treated as non-glossy.
		normal = Vector3.Reflect(inRay, normal);
		if(roughness > 0) { return GGX(normal, hit, roughness, diffuse, metallic); }//return ShaderReturn(SampleHemisphereCap(normal, roughness * 180.0), hit.point, diffuse, 1); } //Applies the roughness to the reflection normal.
		else { return ShaderReturn(normal, hit.point, Color.Lerp(Color.white, diffuse, metallic), 1.0); }  //So we don't waste compute power.
	}
	else {  //Transmit ray / diffuse it.
		rand = Random.value;
		var transmit = transmission >= rand;
		if(transmit) { 
			return Refract(inRay, normal, roughness, hit, diffuse, ior);
			//return SSS(hit, normal, Color.red, 3);
		}
		else {
			return Diffuse(normal, hit, diffuse);
		}
	}
}

//--------------SHADER FUNCTIONS-------------------------
function Refract(i : Vector3, n : Vector3, roughness : float, hit : RaycastHit, color : Color, ior : float) {
	if(Vector3.Dot(n, i) > 0) {
			n = n * -1.0;
			ior = 1.0 / ior;
	}
	ior = 1.0 / ior;
	var cost1 : float = Vector3.Dot(n, i) * -1;
	var cost2 : float = 1.0 - ior * ior * (1.0 - cost1 * cost1);
	if(cost2 > 0) {
		i = Vector3.Normalize((i * ior) + (n * (ior * cost1 - Mathf.Sqrt(cost2))));
		return ShaderReturn(GGX(i, hit, roughness, color, 0).direction, hit.point + (i*0.05), color, 1.0);  //Added a displacement to origin to fix self-collision. Metals aren't transmissive so metallic = 0.
	}
}

function Diffuse(normal : Vector3, hit : RaycastHit, diffuse : Color) {  //Non-uniform, importance sampled.
	var theta = Mathf.Asin(Mathf.Sqrt(Random.value));
	var phi = Random.value * 360.0;
	var dir = Vector3.Normalize(Quaternion.LookRotation(normal, Vector3.up) * SphereToCart(theta, phi));
	var c = diffuse * Vector3.Dot(dir, normal);  //Cosine weighting.
	return ShaderReturn(dir, hit.point, c, 1.0);
}

function GGX(normal : Vector3, hit : RaycastHit, roughness : float, albedo : Color, metallic : float) {
	var r2 = roughness*roughness;
	var epsilon = Random.value;
	var theta = Mathf.Acos(Mathf.Sqrt((1.0 - epsilon) / ((epsilon * (r2 - 1.0)) + 1.0)));
	var phi = Random.value * 360.0;
	var dir : Vector3 = Vector3.Normalize(Quaternion.LookRotation(normal, Vector3.up) * SphereToCart(theta, phi));
	return ShaderReturn(dir, hit.point, Color.Lerp(Color.white, albedo, metallic), 1.0);
}



function SSS(hit : RaycastHit, normal : Vector3, color : Color, size : float) {
	var newPoint = hit.point + SampleHemisphereCap(-normal, 180) * size;
	var r : Ray;
	var np : Vector3;
	while(IsInside(hit.collider, newPoint)) {
		np = newPoint + Random.onUnitSphere * size;
		r = Ray(newPoint, Vector3.Normalize(np - newPoint));
		newPoint = np;
		color -= color / 30;
	}
	hit.collider.Raycast(r, hit, 100);
	var origin = hit.point;
	var direction = SampleHemisphereCap(-hit.normal, 180);
	return ShaderReturn(direction, origin, color, 1.0);
}



//NON-SHADER FUNCTIONS-------------------------------------------------
function SampleHemisphereCap(normal : Vector3, angle : float) : Vector3 { //Whoop! This one works!
	angle /= 2;
	var targetDirection : Quaternion = Quaternion.LookRotation(normal, Vector3.up);
    var angleInRad = Random.Range(0.0, angle) * Mathf.Deg2Rad;
    var PointOnCircle = (Random.insideUnitCircle.normalized) * Mathf.Sin(angleInRad);
    var v = Vector3(PointOnCircle.x, PointOnCircle.y, Mathf.Cos(angleInRad));
    return Vector3.Normalize(targetDirection * v);
}

function NormalToDir(surfaceNormal : Vector3, col : Color) {  //Normal ray generation for OpenGL normal maps.
	var targetDirection : Quaternion = Quaternion.LookRotation(surfaceNormal, Vector3(0,1,0));  //Y is up in Unity.
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

function Fresnel(incident : Vector3, normal : Vector3, incomingIOR : float, outgoingIOR : float) {
    var ior : float = incomingIOR / outgoingIOR;
    var cosThetaI : float = Mathf.Abs(Vector3.Dot(incident, normal));
    cosThetaI = Mathf.Min(1, cosThetaI);
    var sinThetaI : float = Mathf.Sqrt(1.0 - cosThetaI * cosThetaI);
    var sinThetaT : float = ior * sinThetaI;
    if (sinThetaT > 0.999f) // TIR
        return 1;
    var cosThetaT : float = Mathf.Sqrt(1.0 - sinThetaT * sinThetaT);
    var Rperp : float = (incomingIOR * cosThetaI - outgoingIOR * cosThetaT) / (incomingIOR * cosThetaI + outgoingIOR * cosThetaT);
    Rperp = Rperp * Rperp;
    var Rpara : float = (outgoingIOR * cosThetaI - incomingIOR * cosThetaT) / (outgoingIOR * cosThetaI + incomingIOR * cosThetaT);
    Rpara = Rpara * Rpara;
    return (Rperp + Rpara) / 2.0;
}

function FullDiffuseReflectanceModel(normal : Vector3) { //No variance in roughness - fully diffuse.
	var v : Vector3 = Random.onUnitSphere;
	return v * Mathf.Sign(Vector3.Dot(v, normal));
}

function SphereToCart(theta : float, phi : float) {
	var sinTheta = Mathf.Sin(theta); //We use this twice.
	return Vector3(sinTheta * Mathf.Cos(phi), sinTheta * Mathf.Sin(phi), Mathf.Cos(theta));
}

function CartToAzimuth(v : Vector3) {
	return Mathf.Acos(v.y / v.magnitude);
}