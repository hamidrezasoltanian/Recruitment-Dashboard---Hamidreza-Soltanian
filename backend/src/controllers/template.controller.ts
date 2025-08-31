import { Request, Response } from 'express';
import TemplateModel from '../models/template.model';

// @FIX: Changed Request/Response types to named imports from express to resolve type errors.
export const getAllTemplates = async (req: Request, res: Response) => {
    try {
        const templates = await TemplateModel.find().sort({ createdAt: -1 });
        res.status(200).json(templates);
    } catch (error: any) {
        res.status(500).json({ message: 'Error fetching templates', error: error.message });
    }
};

// @FIX: Changed Request/Response types to named imports from express to resolve type errors.
export const createTemplate = async (req: Request, res: Response) => {
    try {
        const newTemplate = new TemplateModel(req.body);
        await newTemplate.save();
        res.status(201).json(newTemplate);
    } catch (error: any) {
        res.status(500).json({ message: 'Error creating template', error: error.message });
    }
};

// @FIX: Changed Request/Response types to named imports from express to resolve type errors.
export const updateTemplate = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updatedTemplate = await TemplateModel.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedTemplate) {
            res.status(404).json({ message: 'Template not found' });
            return;
        }
        res.status(200).json(updatedTemplate);
    } catch (error: any) {
        res.status(500).json({ message: 'Error updating template', error: error.message });
    }
};

// @FIX: Changed Request/Response types to named imports from express to resolve type errors.
export const deleteTemplate = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const deletedTemplate = await TemplateModel.findByIdAndDelete(id);
        if (!deletedTemplate) {
            res.status(404).json({ message: 'Template not found' });
            return;
        }
        // FIX: Use status(204) for successful deletion with no content.
        res.status(204).send();
    } catch (error: any) {
        res.status(500).json({ message: 'Error deleting template', error: error.message });
    }
};