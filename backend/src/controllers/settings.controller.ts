import express from 'express';
import SettingsModel from '../models/settings.model';
import { DEFAULT_STAGES, DEFAULT_SOURCES, DEFAULT_COMPANY_PROFILE, DEFAULT_TEST_LIBRARY } from '../constants';

// FIX: Changed Request/Response types to express.Request/express.Response to resolve type errors.
export const getSettings = async (req: express.Request, res: express.Response) => {
    try {
        let settings = await SettingsModel.findOne();
        if (!settings) {
            // If no settings exist, create them from defaults
            settings = new SettingsModel({
                stages: DEFAULT_STAGES,
                sources: DEFAULT_SOURCES,
                companyProfile: DEFAULT_COMPANY_PROFILE,
                testLibrary: DEFAULT_TEST_LIBRARY,
            });
            await settings.save();
        }
        res.status(200).json(settings);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching settings', error: error.message });
    }
};

// FIX: Changed Request/Response types to express.Request/express.Response to resolve type errors.
export const updateSettings = async (req: express.Request, res: express.Response) => {
    try {
        const updatedSettingsData = req.body;
        
        // Use findOneAndUpdate with upsert:true to either update existing or create new settings doc
        const settings = await SettingsModel.findOneAndUpdate({}, updatedSettingsData, {
            new: true,
            upsert: true,
            runValidators: true,
        });

        res.status(200).json(settings);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: 'Error updating settings', error: error.message });
    }
};
