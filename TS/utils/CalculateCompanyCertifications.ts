
/**
 * Given a user and a course ID, return the number of completions and the dates they were achieved.
 * @param user a User object
 * @param courseID Litmos course ID
 * @returns the numbers of completions and the dates they were achieved.
 */
function countUserCourseCompletions(user: User, courseID: string) {

  //Filter out only the achievements you want
  var thisCourseAchievements = user.CoursesCompleted.filter((course)=> {
    return course.CourseId = courseID
  });
  
  //Count the number of completions
  var numberOfCompletions = thisCourseAchievements.length;

  //Collapse the completions dates into one array for returning
  var completionDates = thisCourseAchievements.map((course)=> {
    return course.AchievementDate;
  });
  
  return {
    numberOfCompletions,
    completionDates
  }
}

/**
 * Given a set of company users in a User[] and a given courseID, return an array of users who have completions of that specific course
 * @param users 
 * @param courseID 
 * @returns [{emailAddress, userName, and [completionDates]}] for users with this course achievement.
 */

function getCompanyCourseCompletions(users: User[], courseID: string) {

  
}