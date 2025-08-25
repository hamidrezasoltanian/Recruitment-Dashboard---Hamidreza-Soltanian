import express from 'express';
import CandidateModel, { ICandidate } from '../models/candidate.model';

export const getAllCandidates = async (req: express.Request, res: express.Response): Promise<void> => {
    try {
        const candidates: ICandidate[] = await CandidateModel.find();
        res.status(200).json(candidates);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching candidates' });
    }
};

export const getCandidateById = async (req: express.Request, res: express.Response): Promise<void> => {
    try {
        const { id } = req.params;
        const candidate: ICandidate | null = await CandidateModel.findById(id);
        if (!candidate) {
            res.status(404).json({ message: 'Candidate not found' });
            return;
        }
        res.status(200).json(candidate);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching candidate' });
    }
};

export const createCandidate = async (req: express.Request, res: express.Response): Promise<void> => {
    try {
        // The frontend sends 'id', we map it to '_id' for MongoDB
        const { id, ...candidateData } = req.body;
        
        if (!id || !candidateData.name || !candidateData.email || !candidateData.stage) {
            res.status(400).json({ message: 'Missing required fields' });
            return;
        }

        const newCandidateData = {
            _id: id,
            ...candidateData
        };

        const newCandidate = new CandidateModel(newCandidateData);
        await newCandidate.save();
        res.status(201).json(newCandidate);
    } catch (error: any) {
        console.error(error);
        if (error.code === 11000) { // MongoDB duplicate key error
            res.status(409).json({ message: 'Candidate with this email or ID already exists.' });
            return;
        }
        res.status(500).json({ message: 'Error creating candidate' });
    }
};

export const updateCandidate = async (req: express.Request, res: express.Response): Promise<void> => {
    try {
        const { id } = req.params;
        const candidateData = req.body;
        
        // Ensure the _id is not changed via the request body
        delete candidateData._id;
        
        const updatedCandidate: ICandidate | null = await CandidateModel.findByIdAndUpdate(id, candidateData, { new: true });
        
        if (!updatedCandidate) {
            res.status(404).json({ message: 'Candidate not found' });
            return;
        }
        res.status(200).json(updatedCandidate);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating candidate' });
    }
};

export const deleteCandidate = async (req: express.Request, res: express.Response): Promise<void> => {
    try {
        const { id } = req.params;
        const result = await CandidateModel.findByIdAndDelete(id);
        if (!result) {
            res.status(404).json({ message: 'Candidate not found' });
            return;
        }
        res.status(200).json({ message: 'Candidate deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting candidate' });
    }
};