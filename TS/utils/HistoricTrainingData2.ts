function onOpen() {
  var ui = SpreadsheetApp.getUi()
  ui.createMenu('Training History')
      .addItem('Get User History for cID at A2', 'displayIndividualUserResults_')
      .addToUi()
}

function displayIndividualUserResults_() {
  var sheet = SpreadsheetApp.getActiveSheet()

  //Validating that it's the proper sheet
  if (sheet.getName()!=="Historic Training") {
    SpreadsheetApp.getUi().alert("Run this function on the 'Historic Training' sheet plz :)")
    throw new Error()
  };

  console.log("Here we go!")
  //Grab the companyID
  var cID = sheet.getRange(2,1).getValue()

  //If there isn't one, alert the user.
  if (cID=="") {
    SpreadsheetApp.getUi().alert("There's no company ID in cell A2. Please put one in and try again.")
    throw new Error("There's no company ID in cell A2. Please put one in and try again.");
  }

  try {
    console.log(`Searching for OBSD for ${cID}.`)
    var obsd = findOBSD(cID).toString();
    console.log(`Tried finding OBST; results are: ${obsd}\n Length: ${obsd.length}`);
      if (obsd.length>0) {
        try {
          console.log(`Can I cast the obst as a date? ${obsd as Date}`)
        } catch (err) {console.log(`Issue casting the osbd as a date: ${err}`)
      }
        console.log(`Onboarding start date found: ${obsd}.`)
        displayCompanyHistoricTrainingOnSS_(cID,obsd as Date) 

      } else {
        //No onboarding start date could be found
        console.log(`Unable to find an onboarding start date for ${cID} in column N of sheet 'Training Status by AM' in spreadsheet 'Sales Cohort Training Status Tracker'. Attempting to run the report as if the OBST were exactly 60 days ago.`)
        var trying60daysAgo = calculateDaysAgo_(60);
        console.log(`Onboarding start date was not found: ${obsd}. Continuing. Attempting instead with ${trying60daysAgo}`)
        displayCompanyHistoricTrainingOnSS_(cID,trying60daysAgo);
        
      }
    } catch (err) {
      SpreadsheetApp.getUi().alert(`Oh no something went wrong!\n ${err}`)
  }


}


/**
 * Main runner to get a company's training history as far back as you'd like. 
 * @param companyID SharpSpring company ID (eg. 308234543)
 * @param activationDate Can be pasted straight from a Google sheets date field
 * @param reportingDayLength How many days should be included in the report?
 */
function getCompanyHistoricalAchievementArray_(companyID: string, activationDate: string| Date, reportingDayLength: number=60) {
  //Establish how far back to report, typically 60 days
  //Then format in YYYY-MM-DD for Litmos
  var reportingThreshold = formatDate(calculateDaysAgo_(reportingDayLength))

  //Search Litmos for all users with the corresponding companyID
  
  console.log(`Getting all company users.`)
  var allCompanyUsers = getAllCompanyUsers(companyID)

  //Get the training status for each user
  console.log(`Getting individual training records from Litmos.`)
  var allUserTrainingStatus = getAllUserLitmosAchievements_(allCompanyUsers, reportingThreshold)

  //Correct achievement dates so they're out of Litmos form
  console.log(`Fixing training dates`)
  var allUserTrainingStatus_properDates = allUserTrainingStatus.map(function(user){
    user.CoursesCompleted = fixLitmosDates_(user.CoursesCompleted)
    return user
  })

  //Correct achievement dates so they're relative to activation date
  console.log(`Adjusting dates so they are based on OBST.`)
  var allUsersAchievements = adjustAchievementDatesByActivationDate_(allUserTrainingStatus_properDates, activationDate)

  //Build the whole historical array with the given adjusted achievements
  var historicArray = buildHistoricalAchievementArray_(allUsersAchievements, reportingDayLength)

  //Loop through the historicArray and add each users' historical array to the User
  console.log(`adding the course history record to each user object.`)
  var userHistoricData: User[] = allUsersAchievements.map(function(user,userIndex){
    user.CourseHistory = historicArray[userIndex]
    return user
  })
  
  return userHistoricData

/**
 * * HELPER FUNCTIONS!!!!!!!
 * * HELPER FUNCTIONS!!!!!!!
 */
       

        /**
       * This function consumes the complete user achievements[] and returns the array with each {} having converted dates
       * @param achievements the complete achievements array recieved from getLitmosAchievements()
       * @returns the same set of achievements but with standardized dates
       */
      function fixLitmosDates_(achievements:Achievement[]){
        let fixedAchievements = achievements.map(function (achievement){
          achievement.AchievementDate = convertLitmosDate(achievement.AchievementDate).toString()
          return achievement
        })
        return fixedAchievements
      }

        /**
       * Pass in the whole company training record [] and ingest each user then each achievement therein to adjust the AchievementDate in terms of the activationDate
       * @param {User[]} allUserallUsersAchievements  comes from getAllUsersTrainingStatus()
       * @param {string|date} activationDate
       */
      function adjustAchievementDatesByActivationDate_( allUserallUsersAchievements: User[], activationDate: string|Date) {
        //map through each user
        allUserallUsersAchievements.forEach(function(user) {
          user.CoursesCompleted.forEach(function(achievement){
            achievement.DaysIntoOnboardingWhenCompleted = daysBetween_(achievement.AchievementDate,activationDate)
          })
        })
        return allUserallUsersAchievements

        /**
         * * HELPER FUNCTIONS!!!!!!!
         * * HELPER FUNCTIONS!!!!!!!
         */

          /**
           * This function takes two times and finds the number of days between them, as a decimal
           * @param t1 Time 1
           * @param t2 Time 2, or leave empty to compare it with now
           */
          function daysBetween_(t1: string | Date,t2: string | Date | undefined) {
            return daysSince(millsSince(t1,t2))
            }
        }

  /**
   * Loop through all users/achievements and place them onto a grid that's as many days wide as you want to report on. Default is 62 days
   * @param allUsersAchievements User[] of all training history chained from adjustAchievementDatesByActivationDate_
   * @param daysToReportOn set how many columns the reporting array should be to place users' achievements onto the sheet
   */
  function buildHistoricalAchievementArray_(allUsersAchievements: User[],daysToReportOn: number = 60) {
    //Create a 2d array, with one row per user
    var achievementsArray = Array.from(Array(allUsersAchievements.length), () =>  Array(daysToReportOn))
    
  
    //Loop through all the achievements for a user
    //If the achievement is in the reporting window, add it to the company's achievementsArray for the proper user in the proper cell
    allUsersAchievements.forEach(function(user, userIndex){
      user.CoursesCompleted.forEach(function(achievement, achievementIndex){

        //Throw the UserName into the achievement's array
        achievement.UserWhoAchieved = user.UserName

        //Decide which day's cell to fill
        var day = Math.floor(achievement.DaysIntoOnboardingWhenCompleted || 0)
        
        //If the day is within the scope of reporting (onboarding), add the achievement into the array
        if (day < daysToReportOn){

          try{
            //Make sure there actually is an achievement there
            if (typeof achievement !== "undefined") {
              //debugging
              var currentValue = achievementsArray[userIndex][day]
              
              //If the array is undefined, then set the first value to avoid `undefined` errors
              if (typeof currentValue == "undefined") {
                achievementsArray[userIndex][day]=[achievement]
              }
              else {
              //The array has already been defined, so push the next achievement onto that day
                achievementsArray[userIndex][day].push(achievement)
              } 
            }
            else {
              console.log("This is an empty achievement")
            }
          } 
          catch (err)  {throw new Error(err)}
        }
      })
    })
    return achievementsArray as [[Achievement[]]]
  }

}

function runthismydude(){
var myw00tarray = getCompanyHistoricalAchievementArray_("308477846","2020-02-01",90)
console.log(myw00tarray)
}




async function displayCompanyHistoricTrainingOnSS_(
  companyID: string, 
  onboardingStartDate: Date, 
  reportingThreshold:number = 60, 
  sheet= SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Historic Training")) {

    //Make sure the sheet exists
    if (!sheet) throw new Error ("No sheet given or sheet doesn't exist.")

    //Get all achievements for users from Litmos. 
    console.log("Getting user achievements.")
    var userHistories= await getCompanyHistoricalAchievementArray_(companyID, onboardingStartDate, reportingThreshold)

    //Insert beautification
    console.log("Beautifying array.")
    var prettyArray = beautifyHistoricalArray_(userHistories)

    //Calculate the range to place onto SpreadSheet
    var rows = prettyArray.length
    var columns = Math.max(...(prettyArray.map(day =>  day.length)))
    console.log(`Calculated range for placing on ss: rows: ${rows}, columns: ${columns}.`)

    //Clear the old data
    console.log('Trying to clear old data off.')
    var oldData = sheet.getDataRange().offset(4,0).clear({contentsOnly:true})
    var obst_formatted: string; 
    try{
      obst_formatted = onboardingStartDate.toString().split(" ").slice(1,4).join(" ");
      console.log(`Spliting the date: ${obst_formatted}`);
    } catch (err) {console.log(`There was an issue formatting the date: ${err}`)}
   
    var returnDate = function(){if (obst_formatted) return obst_formatted; else return onboardingStartDate}
    var topOBSD = sheet.getRange(2,2).setValue(returnDate())

    console.log("Trying to place the data onto the sheet.")
    var r = sheet.getRange(5,1,rows,columns).setValues(prettyArray)

}


/**
 * Prep the achievement data to look better on a spreadsheet. 
 * 1. Remove rows for users with no data to speed up searching
 * 2. If one of them was the achievement test, put a * instead
 * 3. Instead of slamming all the achievement data into one cell, display how many courses were completed that day
 * 4. Displays "xx others users with no achievements" at the bottom
 * @param users comes from getCompanyHistoricalAchievementArray_()
 */
function beautifyHistoricalArray_(users: User[] ){

  //1. Strip out users with no achievements
  console.log(`Stripping out users without achievements. Pre-strip total: ${users.length} Litmos accounts for this company`)
  var strippedOutNonAchievers = users.filter(user => user.CoursesCompleted.length > 0 )
  console.log(`After stripping, number of users with achievements: ${strippedOutNonAchievers.length}.`)
  
  //2. Check if any users completed the certification courses
  console.log(`Checking for certified users.`)
  var certificationNoted = strippedOutNonAchievers.map(user => checkIfUserIsCertified_(user))

  //smash down empty user achievement arrays so that all they have are days someone got certified.
  var userCertified = certificationNoted.map(function (user){
    return user.filter( dailyAch => (dailyAch>-1)); 
  });
  console.log(`Similar data from certificationNoted but smashed down: ${userCertified}`);
  
  //3. Loop through each day and instead of returning the specific achievements, return how many achievements there are
  //If one of the achievements was a certification achievement, add a * to the number
  console.log(`transforming achievements into numbers`)
  var numericalAchievementArray = transformDailyAchievementArrayIntoNumericalArray_(strippedOutNonAchievers, certificationNoted)

  //Loop through each user and add their name and if they earned at least one certification achievement into the first two cells
  console.log(`adding names and stuff at the beginning of the achievement arrays`)
  numericalAchievementArray.forEach(function(user, userIndex){
     user.unshift(
      `${strippedOutNonAchievers[userIndex].UserName}`,
      `${strippedOutNonAchievers[userIndex].FirstName} ${strippedOutNonAchievers[userIndex].LastName}`,
      `${(userCertified[userIndex].length>0)}`)
  })
  console.log(`Numerical array with names added. Example first row: ${numericalAchievementArray[0]}`)
  //Attempting to show how many users have no achievements, but struggling with adding it to the same array. For simplicity, just do it in another function.
  //!!!!!
    // console.log(`adding a new row at the bottom to say how many users have no achievements`);
    // numericalAchievementArray.push(Array.from(numericalAchievementArray[0][0], () => ("")));

    // console.log(`adding the additional users without achievements`);
    // numericalAchievementArray[numericalAchievementArray.length-1]=[`${users.length-strippedOutNonAchievers.length} additional users with no achievements.`]
    
    // console.log(`trying to make the size of the array match the other ones.`);
    // numericalAchievementArray[numericalAchievementArray.length-1].length=numericalAchievementArray[0].length

  console.log(`Beautifying complete!`)
  return numericalAchievementArray

  

/**
 * 
 * * HELPER FUNCTIONS!!!!!!!
 * * HELPER FUNCTIONS!!!!!!!
 * * HELPER FUNCTIONS!!!!!!!
 * * HELPER FUNCTIONS!!!!!!!
 * * HELPER FUNCTIONS!!!!!!!
 */

  /**
   * Given a User, loops through each day in the CoursesCompleted[] to see if any match the certification courses, and returns the days where they earned a certification
   * @param user 
   * @param certificationCourseIDs optional array to specify additional certification courses other than the MAE. default will be ["PgqK7l17TdE1"]
   * @returns the days a user got certified or an empty array if they have never been certified
   */
  function checkIfUserIsCertified_(user: User, certificationCourseIDs?: string[] | undefined) {
    //Loop through each day in the user's course history and check if that course was achieved that day
    var certificationDays: number[] = user.CourseHistory.map( function (daysCourses,dayIndex: number){
      //Check if the user get certified on a given day
      if (checkCertificationStatus(daysCourses, certificationCourseIDs).certificationPercent > 0 ){
        return dayIndex
      } else return -1
    })
    
    return (certificationDays)  
    
  }

  /**
   * Take an array of users with achievements and replace the achievement data with a number.
   * Adds a * if the course was a certification course
   * @param strippedOutNonAchievers 
   * @param certificationNoted 
   */
  function transformDailyAchievementArrayIntoNumericalArray_( strippedOutNonAchievers: User[], certificationNoted: number[][]) {
    var numericalAchievementArray = strippedOutNonAchievers.map(function (user, userIndex) {
      var numberArray = user.CourseHistory.map(function (day, dayIndex) {
        var count = day.length
        if (certificationNoted[userIndex][dayIndex]>-1) {
          return String(count) + "*"
          } else return String(count)
        })
      return numberArray
      })
    return numericalAchievementArray
    }
  }

function displayRunner() {
  displayCompanyHistoricTrainingOnSS_("308479000",new Date(2020,1,3));
}

/**
 * Get the date a given number of days again
 * @param since number of days ago
 * @returns the date so many days ago
 */
function calculateDaysAgo_(since: number) {
  var d= new Date()
  d.setDate(d.getDate()-since)
  return d
}

function findOBSD(companyID: string, sheet = SpreadsheetApp.openById("1m23pHEfPT5byJbKqlmMbIc6ZGDN9mRHHVL6ABWvdRW8").getSheetByName("Training Status by AM")) {
  if (sheet) {
      var r = sheet.getRange("A:A")
      console.log(`searching for ${companyID}.}`)
      var rows, values = r.getValues()
      for (var i: number =0; i<values.length;i++) {
          if (values[i][0]==companyID) {
              console.log(`found ${companyID} at values[${i}][0]`)
              rows=i+1
              return sheet.getRange(rows,14).getValue() 
          }
      }
      console.log(`Company Id ${companyID} not found.`)
      return ""
      }  
  
  else throw new Error(`The given sheet, ${sheet}, couldn't be found`)
}