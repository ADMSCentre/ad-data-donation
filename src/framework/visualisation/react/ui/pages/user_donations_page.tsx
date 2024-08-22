// For users to see their own donations once logged in

import { useCallback, useContext, useEffect, useState } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import awsConfig from "../../../../../aws.config";
import "ag-grid-community/styles/ag-grid.css"; // Mandatory CSS required by the Data Grid
import "ag-grid-community/styles/ag-theme-quartz.css"; // Optional Theme applied to the Data Grid
import { BsClipboardData, BsDownload, BsViewList } from "react-icons/bs"
import { BarLoader } from "react-spinners";
import JSZip from "jszip";
import useListUserDonations from "../hooks/useListUserDonations";
import withDarkModeLoader from "../elements/loader_wrapper";

interface Donation {
  timestamp: string;
  date: string;
  time: string;
  files: {
    filename: string;
    size: number
  }[];
}

const ThemedBarLoader = withDarkModeLoader(BarLoader);

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

  const [isDownloading, setIsDownloading] = useState(false);
  const { username } = useContext(AuthContext);
  const zip = new JSZip();

  const downloadFiles = useCallback(() => {
    setIsDownloading(true);
    const downloadUrl = `${awsConfig["lambda-get-url"]}`;
    const promises = donation.files.map((file) => {
      return fetch(downloadUrl, {
        method: "POST",
        body: JSON.stringify({
          bucket_name: awsConfig["s3-bucket-name"],
          path: `${username}/${donation.timestamp}/${file.filename}`
        })
      })
        .then((response) => response.json())
        .then((data) => {
          const { url } = data;
          // Get the file as a blob
          return fetch(url)
            .then((response) => response.blob())
        })
    });
    Promise.all(promises).then((blobs) => {
      blobs.forEach((blob, index) => {
        zip.file(donation.files[index].filename, blob);
      });
      zip.generateAsync({ type: "blob" })
        .then((content) => {
          const url = URL.createObjectURL(content);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${donation.timestamp}.zip`;
          a.click();
        });
      setIsDownloading(false);
    }).catch((error) => {
      console.error("Failed to download files", error);
      setIsDownloading(false);
    });
  }, [donation.files, donation.timestamp, username]);

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
      <div className="flex justify-between items-center text-sm">
        <a
          href={`?username=${username}&timestamp=${donation.timestamp}&review=true`}
          rel="noreferrer"
          className="flex items-center gap-2 text-primary hover:text-primarydark transition-all justify-center"
        >
          <BsClipboardData />
          <span>Summary</span>
        </a>
        <button
          type="button"
          className="flex items-center gap-2 hover:text-primarydark transition-all text-text underline disabled:cursor-not-allowed justify-center"
          disabled={isDownloading}
          onClick={downloadFiles}
        >
          {
            !isDownloading
              ? (
                <>
                  <BsDownload />
                  <span>Download ({kilobytes} KB)</span>
                </>
              ) : (
                <>
                  <ThemedBarLoader />
                </>
              )
          }
        </button>
      </div>
    </div>
  );
}

const UserDonationsPage = () => {
  const { username } = useContext(AuthContext);
  const { data: donations, isLoading } = useListUserDonations(username);

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