

// Fix: Use direct Request and Response types from express
import { Request, Response } from 'express';
import SettingsModel from '../models/settings.model';
import { DEFAULT_STAGES, DEFAULT_SOURCES, DEFAULT_COMPANY_PROFILE, DEFAULT_TEST_LIBRARY } from '../../../frontend/constants'; // Use frontend defaults

// Fix: Use direct Request and Response types
export const getSettings = async (req: Request, res: Response) => {
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

// Fix: Use direct Request and Response types
export const updateSettings = async (req: Request, res: Response) => {
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
