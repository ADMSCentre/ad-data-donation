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

export interface ListUserDonationResponse {
  timestamp: string;
  date: string;
  time: string;
  platform: string;
  files: {
    filename: string;
    size: number
  }[];
}

async function getFileContent(username: string, platform: string, timestamp: string, filename: string): Promise<any> {
    const url = `${base}/donations/${username}/${platform}/${timestamp}/${encodeURIComponent(filename)}`;
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    if (!response.ok) {
        throw new Error(`Failed to get file content: ${response.status} ${response.statusText}`);
    }
    return response.json();
}

export async function asDonationWithContent(
    listRespones: ListUserDonationResponse,
) {
    const { timestamp, files, platform } = listRespones;
    const username = localStorage.getItem('username') || 'anonymous';

    const fileContents = await Promise.all(files.map(async (file) => {
        const content = await getFileContent(username, platform, timestamp, file.filename);
        return {
            filename: file.filename,
            content: content as {
                [key: string]: any;
            },
        } satisfies DonationFile;
    }));

    return {
        username,
        platform,
        files: fileContents,
    } satisfies Donation;
}

export async function listUserDonations(username: string, platform?: string): Promise<ListUserDonationResponse[]> {
    let url = `${base}/donations/${username}`;
    if (platform) {
        url += `?platform=${encodeURIComponent(platform)}`;
    }
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    if (!response.ok) {
        throw new Error(`Failed to list donations: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    const donations = (data.donations || []) as {
        id: string;
        platform: string;
        timestamp: number;
        files: string[];
    }[]
    const results = donations.map(donation => {
        const timestamp = donation.timestamp;
        const timestampAsDate = new Date(+timestamp * 1000);
        const date = timestampAsDate.toLocaleDateString();
        const time = timestampAsDate.toLocaleTimeString();
        return {
            timestamp: donation.timestamp.toString(),
            date,
            time,
            platform: donation.platform,
            files: donation.files.map(file => ({
                filename: file,
                size: 0 // Size is not provided in the response, set to 0
            }))
        };
    }) satisfies ListUserDonationResponse[];
    return results;
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