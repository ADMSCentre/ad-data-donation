// This file adapts the donations API for sending and accessing donations
const base = 'https://c0z5ki2dea.execute-api.ap-southeast-2.amazonaws.com/prod';

export interface DonationFile {
    filename: string;
    content: {
        [key: string]: any;
    }
}

interface Donation {
    username: string;
    platform: string;
    files: DonationFile[];
}

export async function postDonation(donation: Donation): Promise<void> {
    const { username, platform } = donation;

    const url = `${base}/donations/${username}`;
    const requestBody = {
        platform: platform,
        files: donation.files.map(file => ({
            file_name: file.filename,
            content: file.content,
        })),
    }
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    });
    if (!response.ok) {
        throw new Error(`Failed to post donation: ${response.status} ${response.statusText}`);
    }
}