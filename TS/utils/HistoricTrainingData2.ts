/**
 * Given a companyID, grab any single user (the first for the MVP), and format the users's training record as:
 * 
 * userTrainingHistory: {
 *  FullName: string,
 *  Email: string,
 *  UserName: string,
 *  CoursesCompleted: [
  *   {
  *    Title: string,
  *    CourseID: string,
  *    CompletionDate: (JS date, not weird Litmos Date) Date,
  *    CompliantTillDate? : string 
  *    },
  *    {
  *    CourseTitle: string,
  *    CourseID: string,
  *    CompletionDate: (JS date, not weird Litmos Date) string 
  *    CompliantTillDate? : string  
  *   }
  *    ...
 *   ]   
 *  }
 *  
 */


 // Initial @param is SharpSpring companyID (3089234, eg)
 // 1. Get all litmos users with this companyID
 // 2. Consume (each) the first user and get all achievements
 // 3. Consume each achievement and return the above object
    // Adjust the date, changing it into a standard Date() 
 // 4. Reformat all data

 //getCompanyID from a spreadsheet or something
 //!not real
var companyID= "308468531";


var allCompanyUsers = getAllCompanyUsers(companyID);

var allUserTrainingHistory = allCompanyUsers.map(user => getUserTrainingStatus(user))


/**
 * This function consumes the complete user achievements[] and returns the array with each {} having converted dates
 * @param achievements the complete achievements array recieved from getLitmosAchievements()
 * @returns the same set of achievements but with standardized dates
 */
function fixLitmosDates(achievements: { Title: string; AchievementDate: string; CourseId: string; CompliantTillDate?: string | null | undefined; }[]){
  let fixedAchievements = achievements.map(function (achievement){
    achievement.AchievementDate = convertLitmosDate(achievement.AchievementDate);
    return achievement;
  })
  return fixedAchievements;
}


/**
 * Given a Litmos user object, return it formatted for SharpSpring use.
 * @param user Litmos user gotten by getUser() or getAllCompanyUsers()
 * @returns the directed userTrainingStatus{}
 */
function getUserTrainingStatus(user: { UserName: string; FirstName: string; FullName: string, LastName: string; Email: string; others?: any; }) {
  let coursesCompleted_raw = getLitmosAchievements(user);
  let coursesCompleted_dateCorrected = fixLitmosDates(coursesCompleted_raw)
  return {
    FullName: user.FullName,
    Email: user.Email,
    UserName: user.UserName,
    CoursesCompleted: coursesCompleted_dateCorrected
  }
}