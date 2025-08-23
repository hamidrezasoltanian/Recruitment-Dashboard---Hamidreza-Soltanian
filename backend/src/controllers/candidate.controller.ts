import { Request, Response } from 'express';
import { query } from '../services/db';

export const getAllCandidates = async (req: Request, res: Response) => {
    try {
        const result = await query('SELECT * FROM candidates');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching candidates' });
    }
};

export const getCandidateById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await query('SELECT * FROM candidates WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Candidate not found' });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching candidate' });
    }
};

export const createCandidate = async (req: Request, res: Response) => {
    try {
        const { id, name, email, phone, position, stage, source, rating, createdAt, interviewDate, interviewTime, interviewTimeChanged, history, comments, hasResume, testResults, portalToken } = req.body;
        
        // Basic validation
        if (!id || !name || !email || !stage) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const newCandidate = await query(
            `INSERT INTO candidates (id, name, email, phone, position, stage, source, rating, "createdAt", "interviewDate", "interviewTime", "interviewTimeChanged", history, comments, "hasResume", "testResults", "portalToken")
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
             RETURNING *`,
            [id, name, email, phone, position, stage, source, rating || 0, createdAt || new Date(), interviewDate, interviewTime, interviewTimeChanged || false, JSON.stringify(history || []), JSON.stringify(comments || []), hasResume || false, JSON.stringify(testResults || []), portalToken]
        );
        res.status(201).json(newCandidate.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating candidate' });
    }
};

export const updateCandidate = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, email, phone, position, stage, source, rating, interviewDate, interviewTime, interviewTimeChanged, history, comments, hasResume, testResults, portalToken } = req.body;
        
        const updatedCandidate = await query(
            `UPDATE candidates
             SET name = $1, email = $2, phone = $3, position = $4, stage = $5, source = $6, rating = $7, "interviewDate" = $8, "interviewTime" = $9, "interviewTimeChanged" = $10, history = $11, comments = $12, "hasResume" = $13, "testResults" = $14, "portalToken" = $15
             WHERE id = $16
             RETURNING *`,
            [name, email, phone, position, stage, source, rating, interviewDate, interviewTime, interviewTimeChanged, JSON.stringify(history), JSON.stringify(comments), hasResume, JSON.stringify(testResults), portalToken, id]
        );
        if (updatedCandidate.rows.length === 0) {
            return res.status(404).json({ message: 'Candidate not found' });
        }
        res.status(200).json(updatedCandidate.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating candidate' });
    }
};

export const deleteCandidate = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await query('DELETE FROM candidates WHERE id = $1 RETURNING *', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Candidate not found' });
        }
        res.status(200).json({ message: 'Candidate deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting candidate' });
    }
};
