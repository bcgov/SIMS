"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createForm = exports.updateForm = exports.isFormDeployed = exports.createAuthHeader = void 0;
var dotenv = __importStar(require("dotenv"));
var axios_1 = __importDefault(require("axios"));
dotenv.config({ path: __dirname + "/../.env" });
var formsUrl = process.env.FORMS_URL;
var formsUserName = process.env.FORMS_SA_USER_NAME;
var formsPassword = process.env.FORMS_SA_PASSWORD;
// Expected header name to send the authorization token to formio API.
var FORMIO_TOKEN_NAME = "x-jwt-token";
/**
 * Creates the expected authorization header to authorize the formio API.
 * @returns header to be added to HTTP request.
 */
var createAuthHeader = function () { return __awaiter(void 0, void 0, void 0, function () {
    var token;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, getAuthToken()];
            case 1:
                token = _b.sent();
                return [2 /*return*/, {
                        headers: (_a = {},
                            _a[FORMIO_TOKEN_NAME] = token,
                            _a),
                    }];
        }
    });
}); };
exports.createAuthHeader = createAuthHeader;
/**
 * Gets the authentication token value to authorize the formio API.
 * @returns the token that is needed to authentication on the formio API.
 */
var getAuthToken = function () { return __awaiter(void 0, void 0, void 0, function () {
    var authResponse;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, getUserLogin()];
            case 1:
                authResponse = _a.sent();
                return [2 /*return*/, authResponse.headers[FORMIO_TOKEN_NAME]];
        }
    });
}); };
/**
 * Executes the authentication on formio API.
 * @returns the result of a sucessfull authentication or thows an expection
 * in case the result is anything different from HTTP 200 code.
 */
var getUserLogin = function () { return __awaiter(void 0, void 0, void 0, function () {
    var authRequest, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, axios_1.default.post(formsUrl + "/user/login", {
                        data: {
                            email: formsUserName,
                            password: formsPassword,
                        },
                    })];
            case 1:
                authRequest = _a.sent();
                return [2 /*return*/, authRequest];
            case 2:
                error_1 = _a.sent();
                console.error("Received exception while getting form SA token");
                console.error(error_1);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
var isFormDeployed = function (formAlias, authHeader) { return __awaiter(void 0, void 0, void 0, function () {
    var authRequest, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, axios_1.default.get(formsUrl + "/" + formAlias, authHeader)];
            case 1:
                authRequest = _a.sent();
                return [2 /*return*/, authRequest.status === 200];
            case 2:
                error_2 = _a.sent();
                return [2 /*return*/, false];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.isFormDeployed = isFormDeployed;
var updateForm = function (formAlias, formDefinition, authHeader) { return __awaiter(void 0, void 0, void 0, function () {
    var error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, axios_1.default.put(formsUrl + "/" + formAlias, formDefinition, authHeader)];
            case 1:
                _a.sent();
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                console.error("Error updating the form definition.");
                console.error(error_3);
                throw error_3;
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.updateForm = updateForm;
var createForm = function (formDefinition, authHeader) { return __awaiter(void 0, void 0, void 0, function () {
    var error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, axios_1.default.post(formsUrl + "/form", formDefinition, authHeader)];
            case 1:
                _a.sent();
                return [3 /*break*/, 3];
            case 2:
                error_4 = _a.sent();
                console.error("Error creating the form definition.");
                console.error(error_4);
                throw error_4;
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.createForm = createForm;
