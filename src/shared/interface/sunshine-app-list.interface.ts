import OptionalArray from "./optional-array.interface";
import ISunshineApp from "./sunshine-app.interface";

type ISunshineAppList = {
	"@_status_code": "200";
	App: OptionalArray<ISunshineApp>;
};
export default ISunshineAppList;
