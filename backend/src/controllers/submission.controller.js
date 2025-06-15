import { db } from "../libs/db.js";

export const getAllSubmission = async(req , res) =>{
    try {
        const userId = req.user.id;

        const submissions = await db.submission.findMany({
            userId:userId
        })

        res.status(200).json({
            success:true,
            message:"Submissions fetched successfully",
            submissions
        })
    } catch (error) {
        console.log("Fetch Submissions Error:", error);
        res.status(500).json({
            error: "Failed to fetch submission"
        });
    }
}

export const getSubmissionsForProblem = async(req , res) =>{
    try {
       const userId = req.user.id;
       const problemId = req.params.problemId;
       const submissions = req.params.submission.findMany({
           where:{
               userId:userId,
               problemId:problemId
           }
       }) 

       res.status(200).json({
            success:true,
            message:"All Submissions fetched successfully",
            submissions
        })
    } catch (error) {
        console.log("Fetch Submissions Error:", error);
        res.status(500).json({
            error: "Failed to fetch submissions"
        });
    }
}

export const getAllTheSubmissionsForProblem = async(req , res) =>{
    try {
        const problemId = req.params.problemId;
        const submission = await db.submission.count({
            where:{
                problemId:problemId
            }
        })

        res.status(200).json({
            success:true,
            message:"All Submissions fetched successfully",
            count:submission
        })

    } catch (error) {
        console.log("Fetch Submissions Error:", error);
        res.status(500).json({
            error: "Failed to fetch submissions"
        });
    }
}