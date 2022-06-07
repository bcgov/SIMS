// Sample code to write to the console.
// var system = java.lang.System;
// system.out.println(“System out println”);

var applicationExceptions = [];
var dynamicData = S(execution.getVariable("applicationData"));
// Value assigned to a property to determine that it is a application exception.
var STUDENT_APPLICATION_EXCEPTION_VALUE_IDENTIFIER =
  "studentApplicationException";

function searchExceptions(payload) {
  if (payload.isArray()) {
    var arrayItems = payload.elements();
    for (var i = 0; i < arrayItems.length; i++) {
      // If the payload is an array, iterate through each item
      // looking for some application exception.
      searchExceptions(arrayItems[i]);
    }
  } else if (payload.isObject()) {
    // If the object is an object, iterate through its properties
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
        // Adding adding the same exception twice, for instance for the cases that
        // the exception are added to an array of items like dependents.
        if (applicationExceptions.indexOf(fieldName) === -1) {
          applicationExceptions.push({ exceptionName: fieldName });
        }
      }
    }
  }
}

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
