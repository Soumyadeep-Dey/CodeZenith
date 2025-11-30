import {create} from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

export const useProblemStore = create((set) => ({
    problems:[],
    problem:null,
    solvedProblems:[],
    isProblemsLoading:false,
    isProblemLoading:false,


    getAllProblem
}));