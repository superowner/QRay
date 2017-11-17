var points : Vector3[] = new Vector3[4];
var origin : GameObject;

function Awake() {
	points = GetComponent.<MeshFilter>().mesh.vertices;
	UpdateCamera();
}

function UpdateCamera() {  //Need to call whenever the camera is moved. (Automatically done so upon pressing render btn)
	points = GetComponent.<MeshFilter>().mesh.vertices;
	for(var i = 0; i < points.length; i++) {
		points[i] = transform.TransformPoint(points[i]);
	}
}

function UpdateCameraSize(x, y) {
	
}