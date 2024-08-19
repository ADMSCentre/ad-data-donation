// For users to see their own donations once logged in

import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import awsConfig from "../../../../../aws.config";
import "ag-grid-community/styles/ag-grid.css"; // Mandatory CSS required by the Data Grid
import "ag-grid-community/styles/ag-theme-quartz.css"; // Optional Theme applied to the Data Grid
import { BsClipboardData, BsDownload, BsViewList } from "react-icons/bs"

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
    const filename = key.split("/")[2];
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

async function fetchGetUserDonations(username: string) {
  const requestBody = {
    "bucket_name": awsConfig["s3-bucket-name"],
    "path": `${username}/`
  }
  const presignedUrlResponse = await fetch(`${awsConfig["lambda-get-url"]}`, {
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

function useGetUserDonations(username: string) {
  const [data, setData] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const data = await fetchGetUserDonations(username);
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

function DonationPackage({ donation }: {
  donation: Donation;
}) {
  const kilobytes = Math.round(donation.files.reduce((acc, file) => acc + file.size, 0) / 1024);
  // convert time to 12-hour format (AM/PM)
  const time = donation.time.split(":");
  const hours = +time[0];
  const minutes = time[1];
  const ampm = hours >= 12 ? "PM" : "AM";
  const hours12 = hours % 12 || 12;
  const formattedTime = `${hours12}:${minutes} ${ampm}`;

  return (
    <div className="w-80 border-l-4 border-primary p-4 flex flex-col justify-between shadow hover:shadow-lg transition-all bg-primarylight bg-opacity-10 hover:bg-opacity-100">
      <div>
        <div className="flex gap-4 items-center justify-between">
          <div className="font-semibold">{donation.date}</div>
          <div className="text-sm">{formattedTime}</div>
        </div>
        <div className="font-light text-xs p-2">
          {donation.files.map((file, index) => (
            <div className="text-wrap" key={index}>{decodeURIComponent(file.filename)}</div>
          ))}
        </div>
      </div>
      <div className="flex justify-between text-sm">
        <a
          href={"#"}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 text-primary hover:text-primarydark transition-all"
        >
          <BsClipboardData />
          <span>Summary</span>
        </a>
        <a
          href={"#"}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 text-primary hover:text-primarydark transition-all"
        >
          <BsDownload />
          <span>Download ({kilobytes} KB)</span>
        </a>
      </div>
    </div>
  );
}

const UserDonationsPage = () => {
  const { username } = useContext(AuthContext);
  const { data: donations, isLoading } = useGetUserDonations(username);

  if (!username) {
    return <div>
      <h1>My Donations</h1>
      <p>Please log in to view your donations</p>
    </div>
  }

  return (
    <div className="flex flex-col items-center">
      <h1>Your Donations</h1>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="flex flex-wrap gap-4 max-w-3/4 justify-center">
          {donations && donations.length > 0 ? (
            donations.map((donation, index) => (
              <DonationPackage key={donation.timestamp} donation={donation} />
            ))
          ) : (
            <p>No donations found</p>
          )}
        </div>
      )}
    </div>
  );
}

export default UserDonationsPage;