import System.IO;
import System.Text;


public static class JsonManager {

public static function WriteJson(object : Object, path : String) {
	File.WriteAllText(path, JsonUtility.ToJson(object), Encoding.Unicode);
}

public static function ReadJson(path : String) : Object {
	return JsonUtility.FromJson.<Mat>(File.ReadAllText(path, Encoding.Unicode));
}

}