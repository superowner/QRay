var points : Vector3[] = new Vector3[4];
var origin : GameObject;
var originPoint : Vector3;

function Awake() {
	points = GetComponent.<MeshFilter>().mesh.vertices;
	originPoint = origin.transform.position;
	UpdateCamera();
}

function UpdateCamera() {
	origin.transform.position = originPoint;
	for(var i = 0; i < points.length; i++) {
		points[i] = transform.TransformPoint(points[i]);
	}
}

public function SetFov(fov : float) {
	originPoint.z = fov;
	origin.transform.position = originPoint;
}