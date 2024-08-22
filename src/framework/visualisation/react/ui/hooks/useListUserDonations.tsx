import { useEffect, useState } from "react";
import awsConfig from "../../../../../aws.config";

interface Donation {
  timestamp: string;
  date: string;
  time: string;
  files: {
    filename: string;
    size: number
  }[];
}

function parseS3XML(xmlData: string) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlData, "text/xml");
  const contents = xmlDoc.getElementsByTagName("Contents");
  const data: Donation[] = [];
  for (let i = 0; i < contents.length; i++) {
    const key = contents[i].getElementsByTagName("Key")[0].childNodes[0].nodeValue || "";
    const timestamp = key.split("/")[1]; // Ignore the first element, which is the username
    const filename = decodeURIComponent(key.split("/")[2]);
    const size = +(contents[i].getElementsByTagName("Size")[0].childNodes[0].nodeValue || "");
    const timestampAsDate = new Date(
      +timestamp.slice(0, 4),
      +timestamp.slice(4, 6) - 1, // Month is 0-indexed
      +timestamp.slice(6, 8),
      +timestamp.slice(9, 11),
      +timestamp.slice(11, 13),
      +timestamp.slice(13, 15)
    );
    const date = timestampAsDate.toDateString();
    const time = timestampAsDate.toLocaleTimeString();

    const matchedDonation = data.find((donation) => donation.timestamp === timestamp);
    if (matchedDonation) {
      matchedDonation.files.push({ filename, size });
    } else {
      data.push({
        timestamp,
        date,
        time,
        files: [{ filename, size }]
      });
    }
  }
  return data;
}

async function fetchGetUserDonations(username: string, timestamp: string) {
  const requestBody = {
    "bucket_name": awsConfig["s3-bucket-name"],
    "path": `${username}/` + (timestamp ? `${timestamp}/` : "")
  }
  const presignedUrlResponse = await fetch(`${awsConfig["lambda-list-url"]}`, {
    method: "POST",
    body: JSON.stringify(requestBody),
  })
  const presignedUrlData = await presignedUrlResponse.json();
  const { url } = presignedUrlData;

  const response = await fetch(url);
  // Get response as XML
  const xmlData = await response.text();
  // Parse XML to JSON
  const data = parseS3XML(xmlData);

  // Sort by date and time (newest first)
  data.sort((a, b) => {
    const dateA = new Date(a.date + " " + a.time);
    const dateB = new Date(b.date + " " + b.time);
    return dateB.getTime() - dateA.getTime();
  });
  return data;
}

export default function useListUserDonations(username: string, timestamp: string = "") {
  const [data, setData] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const data = await fetchGetUserDonations(username, timestamp);
      if (!data) {
        console.error("Failed to fetch user donations");
      }
      setData(data);
      setIsLoading(false);
    }

    if (!username) {
      return;
    }
    fetchData();

    return () => {
      setData([]);
      setIsLoading(true);
    };
  }, [username]);

  return { data, isLoading };
}