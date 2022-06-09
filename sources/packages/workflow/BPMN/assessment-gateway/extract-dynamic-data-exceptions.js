// Sample code to write to the console.
// var system = java.lang.System;
// system.out.println(“System out println”);

var applicationExceptions = [];
var dynamicData = S(execution.getVariable("applicationData"));
// Value assigned to a property to determine that it is an application exception.
var STUDENT_APPLICATION_EXCEPTION_VALUE_IDENTIFIER =
  "studentApplicationException";

/**
 * Search entire object properties recursively trying to
 * find properties with the value defined as "studentApplicationException"
 * which identifies an application exception to be reviewed.
 * @param payload object to have the properties checked.
 */
function searchExceptions(payload) {
  if (payload.isArray()) {
    var arrayItems = payload.elements();
    for (var i = 0; i < arrayItems.length; i++) {
      // If the payload is an array, iterate through each item
      // looking for some application exception.
      searchExceptions(arrayItems[i]);
    }
  } else if (payload.isObject()) {
    // If the payload is an object, iterate through its properties
    // looking for some application exception.
    var objectFieldNames = payload.fieldNames();
    for (var i = 0; i < objectFieldNames.length; i++) {
      var fieldName = objectFieldNames[i];
      var objectProp = payload.prop(fieldName);
      if (objectProp.isArray() || objectProp.isObject()) {
        searchExceptions(objectProp);
      } else if (
        objectProp.value() === STUDENT_APPLICATION_EXCEPTION_VALUE_IDENTIFIER
      ) {
        // Check if the same exception was already added, for instance for the
        // cases that the exceptions are added to an array of items like dependents.
        if (applicationExceptions.indexOf(fieldName) === -1) {
          applicationExceptions.push({ exceptionName: fieldName });
        }
      }
    }
  }
}

// Execute the code.
searchExceptions(dynamicData);
// Prepare the payload that will be used to call the SIMS API
// and create the application exceptions, if needed.
execution.setVariable(
  "applicationExceptions",
  JSON.stringify(applicationExceptions)
);
// Set hasApplicationExceptions for easy verification on the workflow decisions.
execution.setVariable(
  "hasApplicationExceptions",
  applicationExceptions.length > 0
);
