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
    console.log("User Role : " , req.user.role);
    // Loop through each reference solution for different languages.
    try {

    for (const [language, solutionCode] of Object.entries(referenceSolutions)) {
            const languageId = getJudge0LanguageId(language);

            if (!languageId) {
                return res.status(400).json({
                    error: `Language ${language} is not supported`
                });
            }

            const submissions = testcases.map(({ input, output }) => ({
                source_code: solutionCode,
                language_id: languageId,
                stdin: input,
                expected_output: output,
            }));

            const submissionResults = await submitbatch(submissions);
            const tokens = submissionResults.map((res) => res.token);
            const results = await pollBatchResults(tokens);

            // ADDED: A check to ensure polling was successful.
            // If results are null, it means Judge0 is still processing or the polling timed out.
            if (!results || results.some(r => r === null)) {
                console.error("Polling for Judge0 results failed or timed out. Results:", results);
                return res.status(500).json({
                    error: `Could not retrieve execution results from the judge for language ${language}. Please try again later.`,
                });
            }


            for (let i = 0; i < results.length; i++) {
                const result = results[i];

                // Status ID 3 means "Accepted". Any other status is a failure.
                if (result.status.id !== 3) {
                    // Provide a more detailed error message
                    const errorDetails = result.stderr ? Buffer.from(result.stderr, 'base64').toString('ascii') : result.status.description;
                    return res.status(400).json({
                        error: `The reference solution for ${language} failed on Testcase ${i + 1}.`,
                        details: `Status: ${result.status.description}. Error: ${errorDetails}`
                    });
                }
            }
        }

        // MOVED: The database creation logic is now OUTSIDE the loop.
        // This code will only run if all validations for all languages have passed.
        const newProblem = await db.problem.create({
            data: {
                title,
                description,
                difficulty,
                tags,
                examples,
                constraints,
                testcases,
                codeSnippets,
                referenceSolutions,
                userId: req.user.id,
            },
        });

        // MOVED: The success response is also OUTSIDE the loop.
        return res.status(201).json({
            success: true,
            message: "Problem created successfully after passing all validations.",
            problem: newProblem
        });
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