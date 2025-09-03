import OptionalArray from "./optional-array.interface";
import ISunshineApp from "./moonlight-app.interface";

type IMoonlightAppList = {
	"@_status_code": "200";
	App: OptionalArray<ISunshineApp>;
};
export default IMoonlightAppList;
