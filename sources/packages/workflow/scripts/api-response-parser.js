// Sample code to write to the console.
// var system = java.lang.System;
// system.out.println(fieldNames[i]);

var httpSuccessCode = connector.getVariable("httpSuccessCode");
var errorCodeName = connector.getVariable("errorCodeName");
var statusCode = connector.getVariable("statusCode");
if (statusCode !== parseInt(httpSuccessCode)) {
  throw new org.camunda.bpm.engine.delegate.BpmnError(errorCodeName, response);
}

/**
 * Recursively read the values from the payload to create workflow variables.
 * If the value is not found a variable with null will be defined.
 * @param payload JSON payload to find and retrieve the value.
 * @param fieldName name configured to be read (e.g. someParent.someChild). The
 * output variable will follow the pattern someParent_someChild.
 * @param fieldsNamesPath keeps track of the hierarchy to allow the proper
 * variable name creation.
 */
function setValuesFromPayload(payload, fieldName, fieldsNamesPath) {
  // Check if the field has some hierarchy (e.g. someParent.someChild).
  var parentIndex = fieldName.indexOf(".");
  if (parentIndex > -1) {
    // Extract the parent field name (e.g. someParent);
    var parentFieldName = fieldName.substring(0, parentIndex);
    fieldsNamesPath.push(parentFieldName);
    // Extract the child field name (e.g. someChild);
    var childFieldName = fieldName.substring(parentIndex + 1);
    // Ensures that the parent exists in the payload.
    if (payload.hasProp(parentFieldName)) {
      var parentPayload = payload.prop(parentFieldName);
      if (parentPayload.isObject()) {
        setValuesFromPayload(parentPayload, childFieldName, fieldsNamesPath);
      }
    } else {
      // If parent does not exists just set null to the variable.
      fieldsNamesPath.push(childFieldName.split("."));
      fieldsNamesPath.push(fieldName);
      setVariableWithFullName(fieldsNamesPath, fieldName, null);
    }
  } else {
    // This means that the last field on the hierarchy was reached and
    // the variable can be set.
    var fieldValue = null;
    if (payload.hasProp(fieldName)) {
      var fieldProp = payload.prop(fieldName);
      if (fieldProp.isArray() || fieldProp.isObject()) {
        fieldValue = fieldProp;
      } else {
        fieldValue = fieldProp.value();
      }
    }
    setVariableWithFullName(fieldsNamesPath, fieldName, null);
  }
}

/**
 * Creates the variable unique names where all the hierarchy is represented,
 * for instance, someParent_someOtherParent_someChild.
 * @param fieldsNamesPath intermediate names in the hierarchy (e.g. someParent_someOtherParent).
 * @param fieldName last name in the hierarchy (e.g. someChild).
 * @param fieldValue value to be set.
 */
function setVariableWithFullName(fieldsNamesPath, fieldName, fieldValue) {
  fieldsNamesPath.push(fieldName);
  var fullVariableName = fieldsNamesPath.join("_");
  connector.setVariable(fullVariableName, fieldValue);
}

var fieldNames = connector.getVariable("fieldNames");
var output = S(connector.getVariable("response"));
for (var i = 0; i < fieldNames.length; i++) {
  setValuesFromPayload(output, fieldNames[i], []);
}
