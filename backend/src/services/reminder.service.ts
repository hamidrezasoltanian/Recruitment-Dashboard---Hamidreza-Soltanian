
import CandidateModel from '../models/candidate.model';
import UserModel from '../models/user.model';

const getTomorrowDateISOStart = (): Date => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
};

const getDayAfterTomorrowISOStart = (): Date => {
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    dayAfter.setHours(0, 0, 0, 0);
    return dayAfter;
};

export const checkAndSendReminders = async () => {
    console.log(`[${new Date().toISOString()}] Running interview reminder check...`);
    
    try {
        const tomorrowStart = getTomorrowDateISOStart();
        const tomorrowEnd = getDayAfterTomorrowISOStart();

        const candidatesToRemind = await CandidateModel.find({
            interviewDate: {
                $gte: tomorrowStart.toISOString(),
                $lt: tomorrowEnd.toISOString(),
            },
            $or: [
                { 'reminderSent.candidate': false },
                { 'reminderSent.interviewer': false, interviewerId: { $ne: null, $exists: true } }
            ]
        }).populate('interviewerId');

        if (candidatesToRemind.length === 0) {
            console.log("No upcoming interviews for tomorrow to send reminders for.");
            return;
        }

        console.log(`Found ${candidatesToRemind.length} candidate(s) with interviews tomorrow.`);

        for (const candidate of candidatesToRemind) {
            // --- Send reminder to Candidate ---
            if (candidate.reminderSent && !candidate.reminderSent.candidate) {
                console.log(`[SIMULATING] Sending interview reminder to candidate: ${candidate.name} at ${candidate.email}`);
                // In a real app, you would integrate an email/SMS service here.
                candidate.reminderSent.candidate = true;
            }

            // --- Send reminder to Interviewer ---
            if (candidate.interviewerId && candidate.reminderSent && !candidate.reminderSent.interviewer) {
                const interviewer = await UserModel.findById(candidate.interviewerId);
                if (interviewer && interviewer.email) {
                    console.log(`[SIMULATING] Sending interview reminder to interviewer: ${interviewer.name} at ${interviewer.email} for candidate ${candidate.name}`);
                    candidate.reminderSent.interviewer = true;
                } else {
                    console.warn(`Could not send reminder to interviewer for candidate ${candidate.name}. Interviewer ID: ${candidate.interviewerId} not found or has no email.`);
                    // To prevent re-checking a user without an email, we mark it as sent.
                    candidate.reminderSent.interviewer = true;
                }
            }
            
            // Save the updated reminder status
            await candidate.save();
        }

    } catch (error) {
        console.error("Error in reminder service:", error);
    }
};

export const startReminderService = () => {
    // Run every hour as requested in the prompt.
    const interval = 60 * 60 * 1000;
    setInterval(checkAndSendReminders, interval);
    console.log(`✅ Interview reminder service started. Will check every ${interval / 60000} minutes.`);
    // Run once on start-up as well to catch any immediate cases.
    checkAndSendReminders();
};
