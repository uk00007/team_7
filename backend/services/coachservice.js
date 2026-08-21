const axios = require('axios');

const User = require('../models/User');

const Activity = require('../models/Activity');

const Submission = require('../models/Submission');

const Team = require('../models/Team');



exports.getRecommendations = async (userId) => {

    try {

        const user = await User.findById(userId).lean();

        if (!user) {

            throw new Error('User not found');

        }



        const team = user.teamId ? await Team.findById(user.teamId).lean() : null;

        const activities = await Activity.find({ status: 'PUBLISHED' }).lean();



        const submissions = await Submission.find({

            studentId: userId,

            status: 'APPROVED',

            score: { $ne: null }

        }).lean();



        const totalScore = submissions.reduce((sum, sub) => sum + (sub.score || 0), 0);

        const averageScore = submissions.length > 0 ? (totalScore / submissions.length) : 0;



        const teamMemberCount = team?.memberIds?.length || 0;

        const teamTotalXP = team?.totalXP || 0;

        const teamContributionRatio = teamTotalXP > 0

            ? Math.min(1, (user.totalXP || 0) / teamTotalXP)

            : 0;



        const payload = {

            student: {

                userId: user._id.toString(),

                totalXP: user.totalXP || 0,

                currentLevel: user.currentLevel || 1,

                currentStreak: user.currentStreak || 0,

                longestStreak: user.longestStreak || 0,

                average_score: averageScore,

                team_member_count: teamMemberCount,

                team_total_xp: teamTotalXP,

                team_contribution_ratio: teamContributionRatio,

            },

            available_activities: activities.map(act => ({

                id: act._id.toString(),

                title: act.title,

                type: act.type,

                category: act.category || 'GENERAL',

                isMandatory: Boolean(act.isMandatory),

                isTeamBased: Boolean(act.isTeamBased),

                maxXP: act.maxXP || 0,

                dueDate: act.dueDate ? act.dueDate.toISOString() : null,

                certificateRequired: Boolean(act.certificateRequired),

                status: act.status || 'PUBLISHED',

            }))

        };



        const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
        const aiResponse = await axios.post(`${AI_SERVICE_URL}/api/coach/recommend`, payload);

        return aiResponse.data;

    } catch (error) {

        console.error('Error communicating with AI Service:', error.message);

        throw new Error('Failed to generate AI recommendations');

    }

};
