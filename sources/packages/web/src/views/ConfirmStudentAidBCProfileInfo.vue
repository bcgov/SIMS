<template>
  <Card class="p-m-4">
    <template #title> Confirm StudentAid BC Profile Information </template>
    <div>YOUR STUDENTAID BC PROFILE INFORMATION></div>
    <template #content>
      This information was provided by you when you first signed in to your account as well as shared by your BC Services Card login.

      <div class="p-fluid ">
          <div class="p-field p-col">
            <label for="fullName">Full Name</label>            
             <div class="p-field p-col">
                Matt Estevas
            </div>
          </div>         
      </div>
      <div class="p-fluid p-formgrid p-grid">
          <div class="p-field p-col-4">
            <label for="dateOfBirth">Date of Birth</label> 
            <div class="p-field p-col">
                Feb 11th 1995
            </div>           
          </div>          
          <div class="p-field p-col-4">
            <label for="gender">Gender</label>
            <div class="p-field p-col">
                Male
            </div>  
          </div>
        </div>
        <h4 class="p-mb-5">If the Information is incorrect, please click here</h4>
        <div class="p-fluid p-formgrid p-grid">
          <div class="p-field p-col-4">
            <label for="homeAddress">Home Address</label>            
              <div class="p-field p-col">
                #112 1042 Jervis Street,
                <br>
                Victoria BC V3C0J5
                <br>
                Canada
              </div>             
          </div>
          <div class="p-grid p-col-6">
            <div class="p-field p-col-6">
              <label for="phone">Phone Number</label>
              <div class="p-field p-col">
                250 588-1101
              </div>                         
            </div>
          </div>
        </div>
        
        <div class="p-field-checkbox p-checkbox-icon">           
                <Checkbox id="infoConfirmation"/>
                <label for="infoConfirmation">I confirm my StudentAid BC Profile information shown is correct</label>            
        </div>
        
        
    </template>
  </Card>        
</template>
<script>
export default {
  setup() {
    // const store = useStore();
    // const user = computed(() => store.state.student.profile);
    // return {
    //   user,
    // };
  },
};
</script>  