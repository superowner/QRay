//Light data objects for bidirectional pathtracing.
class LightData {
	var point : Vector3;
	var normal : Vector3;
	var id : int;
	var color : Color;
	public function LightData(p : Vector3, n : Vector3, i : int, c) {
		this.point = p;
		this.normal = n;
		this.id = i;
		this.color = c;
	}
}

//Returned out of Radiance function.
class LightPath {
	var accumulateColor : Color;
	var lastHitPoint : Vector3;
	public function LightPath(a : Color, l : Vector3) {
		this.accumulateColor = a;
		this.lastHitPoint = l;
	}
}

public class TransformSnapshot {  //Stores all transform data of a Transform component. Mainly used in camera DOF rotations.
	var position : Vector3;
	var rotation : Quaternion;
	var scale : Vector3;
	public function TransformSnapshot(p : Vector3, r : Quaternion, s : Vector3) {
		this.position = p;
		this.rotation = r;
		this.scale = s;
	}
}