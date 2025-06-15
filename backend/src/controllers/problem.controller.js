import { mergeConfig } from "axios";
import { db } from "../libs/db.js"
import { pollBatchResults, getJudge0LanguageId, submitbatch } from "../libs/judge0.lib.js";


export const createProblem = async (req, res) =>{
    // going to get all the data from the request body
    const {
        title, 
        description, 
        difficulty,
        tags,
        examples,
        constraints,
        testcases, 
        codeSnippets, 
        referenceSolutions,
    } = req.body;
    // going to check the user role once again
    if(req.user.role !== "ADMIN") {
        return res.status(403).json({
            error: "You are not allowed to create a problem"
        })
    }
    // Loop through each reference solution for different languages.
    try {
        for(const [language, solutionCode] of Object.entries(referenceSolutions)){
            const languageId = getJudge0LanguageId(language);

            if(!languageId){
                return res.status(400).json({
                    error: `Language ${language} is not supported`
                })
            }

            // 
            const submissions = testcases.map(({input , output}) => ({
                source_code: solutionCode,
                language_id: languageId,
                stdin: input,
                expected_output: output,
            }))

            const submissionResults = await submitbatch(submissions);

            const tokens = submissionResults.map((res) => res.token);

            const results = await pollBatchResults(tokens);

            for(let i=0; i< results.length ; i++){
                const result = results[i];
                console.log("Result--" , result)
                // console.log(
                //     `Testcase ${i+1} and Language ${language} ----- result ${JSON.stringify(result.status.description)}`
                // );

                if(result.status.id !== 3){
                    return res.status(400).json({
                        error: `Testcase ${i+1} failed for language ${language}`,
                    });
                }
            }

            //save the problem in the database

            const newProblem = await db.problem.create({
                data:{
                    title, description, difficulty, tags, examples, constraints, 
                    testcases, codeSnippets, referenceSolutions , userId: req.user.id,
                },
            });

            return res.status(201).json({
                success: true,
                message: "Message created successfully",
                problem: newProblem
            });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            error: "Error while creating Problem",
        })
    }
}

export const getAllProblems = async (req, res) =>{
    try {
       const problems = await db.problem.findMany();

       if(!problems){
        return res.status(404).json({
            error: "No problems Found"
        })
       }

       res.status(200).json({
            success: true,
            message: "Message Fetched successfully",
            problems
       })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            error: "Error while Fetching Problems",
        })
    }
}

export const getProblemById = async (req, res) =>{
    const {id} = req.params;

    try {
       const problem = await db.problem.findUnique(
        {
            where:{
                id,
            }
        })
       
       if(!problem){
        return res.status(404).json({
            error: "Problem not found"
        })
       }

       res.status(200).json({
            success: true,
            message: "Message Created successfully",
            problem,
       })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            error: "Error while Fetching Problem by id",
        })
    }
}

export const updateProblem = async (req, res) =>{
    const{id} = req.params;
    const{
        title,
        description,
        difficulty,
        tags,
        examples,
        constraints,
        testcases,
        codeSnippets,
        referenceSolutions}=req.body

        try {
            const problem= await db.problem.findUnique({
             where:{
                 id,
                }
            })

           if (!problem) {
              return res.status(404).json({
                  error: "Problem not found"
                })
            }

            const updatedProblem= await db.problem.update({
               where:{
                  id,
                },
                data:{
                   title,
                   description,
                   difficulty,
                   tags,
                   examples,
                   constraints,
                   testcases,
                   codeSnippets,
                   referenceSolutions,
                }
            })

            res.status(201).json({
                 success: true,
                 message: "Problem Created successfully",
                 updatedProblem,
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Error while updating the problem",
            })
        }
}   

export const deleteProblem = async (req, res) =>{
    const {id} = req.params;
    try {
          const problem = await db.problem.findUnique(
        {
            where:{
                id,
            }
        }
    );

    if(!problem){
        return res.status(404).json({
            error: "Problem Not Found"
        })
    }
    
    await db.problem.delete(
        {
            where:{
                id,
            }
        }
    );

    res.status(200).json({
        success: true,
        message: "Problem Deleted Successfully",
    });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            error: "Error while deleting the problem"
        })
    }
}       

export const getAllProblemsSolvedByUser = async (req, res) =>{   
    try {
       const problems = await db.problem.findMany({
            where:{
                solvedBy:{
                    some:{
                        userId:req.user.id
                    }
                }
            },
            include:{
                solvedBy:{
                    where:{
                        userId:req.user.id
                    }
                }
            }
       })

       res.status(200).json({
           success:true,
           message:"Problems fetched successfully",
           problems
       })
    } catch (error) {
        console.error("Error fetching problems :", error);
        res.status(500).json({
            error:"Failed to fetch problems"
        })
    }
}