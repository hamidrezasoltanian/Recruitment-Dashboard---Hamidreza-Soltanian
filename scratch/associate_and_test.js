const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const prisma = new PrismaClient();

async function run() {
  try {
    console.log("Fetching candidates...");
    const candidates = await prisma.candidate.findMany({
      include: {
        resumeFiles: true
      }
    });

    console.log("Found candidates:", candidates.map(c => ({ id: c.id, name: c.name, hasResume: c.hasResume, resumeFiles: c.resumeFiles })));

    if (candidates.length === 0) {
      console.log("No candidates found.");
      return;
    }

    // Let's pick the first candidate or search for Mehrnaz Moazeni
    let candidate = candidates.find(c => c.name.includes('مهرناز') || c.name.includes('Mehrnaz')) || candidates[0];
    console.log("Selected candidate for test:", candidate.id, candidate.name);

    const destFilename = `test-resume.pdf`;
    const destPath = `/app/uploads/${destFilename}`;

    if (!fs.existsSync(destPath)) {
      console.error(`Target file does not exist: ${destPath}`);
      return;
    }

    // Update database to link this file
    // Delete existing resume first
    if (candidate.resumeFiles && candidate.resumeFiles.length > 0) {
      for (const rf of candidate.resumeFiles) {
        await prisma.resumeFile.delete({ where: { id: rf.id } });
      }
    }

    const resumeFile = await prisma.resumeFile.create({
      data: {
        filename: destFilename,
        originalName: 'مهرناز_موذنی_JobVision_Persian_Resume (1).pdf',
        mimeType: 'application/pdf',
        size: fs.statSync(destPath).size,
        path: destPath,
        candidateId: candidate.id
      }
    });

    await prisma.candidate.update({
      where: { id: candidate.id },
      data: { hasResume: true }
    });

    console.log("Associated resume in DB:", resumeFile);

    // Let's get login token
    const loginResRaw = execSync('curl -s -X POST http://localhost:3002/api/auth/login -H "Content-Type: application/json" -d \'{"username":"admin","password":"adminpassword"}\'');
    const loginRes = JSON.parse(loginResRaw.toString());
    const token = loginRes.data.token;
    console.log("Logged in successfully. Token obtained.");

    console.log(`Triggering resume analysis endpoint for candidate ${candidate.id}...`);
    const analyzeRaw = execSync(`curl -s -X POST http://localhost:3002/api/candidates/${candidate.id}/analyze-resume -H "Authorization: Bearer ${token}"`);
    const analyzeRes = JSON.parse(analyzeRaw.toString());

    console.log("Analysis Result:", JSON.stringify(analyzeRes, null, 2));

  } catch (err) {
    console.error("Error in test script:", err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
