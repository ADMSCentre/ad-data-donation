// For users to see their own donations once logged in

import { useCallback, useContext, useEffect, useState } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import "ag-grid-community/styles/ag-grid.css"; // Mandatory CSS required by the Data Grid
import "ag-grid-community/styles/ag-theme-quartz.css"; // Optional Theme applied to the Data Grid
import { BsClipboardData, BsDownload, BsViewList } from "react-icons/bs"
import { BarLoader, ClimbingBoxLoader } from "react-spinners";
import JSZip from "jszip";
import useListUserDonations from "../hooks/useListUserDonations";
import withDarkModeLoader from "../elements/loader_wrapper";
import { asDonationWithContent, ListUserDonationResponse } from "../../../../../lib/donations-adapter";

const ThemedBarLoader = withDarkModeLoader(BarLoader);
const ThemedClimbingBoxLoader = withDarkModeLoader(ClimbingBoxLoader);

function DonationPackage({ donation }: {
  donation: ListUserDonationResponse;
}) {
  // convert time to 12-hour format (AM/PM)
  const time = donation.time.split(":");
  const hours = +time[0];
  const minutes = time[1];
  const ampm = hours >= 12 ? "PM" : "AM";
  const hours12 = hours % 12 || 12;
  const formattedTime = `${hours12}:${minutes} ${ampm}`;

  const [isDownloading, setIsDownloading] = useState(false);
  const { username } = useContext(AuthContext);

  const downloadFiles = useCallback(async () => {
    setIsDownloading(true);
    const donationWithContent = await asDonationWithContent(donation);
    if (!donationWithContent) {
      console.error("Failed to fetch donation content");
      setIsDownloading(false);
      return;
    }

    // Create a new JSZip instance
    const zip = new JSZip();
    donationWithContent.files.forEach(file => {
      zip.file(file.filename, JSON.stringify(file.content, null, 2));
    });
    // Generate the zip file
    const content = await zip.generateAsync({ type: "blob" })
    // Create a download link
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${username}_${donation.platform}_${donation.timestamp}.zip`;
    // Trigger the download
    a.click();

    // Clean up
    URL.revokeObjectURL(url);
    setIsDownloading(false);
  }, [donation, username]);

  return (
    <div className="w-80 border-l-4 border-primary p-4 flex flex-col justify-between shadow hover:shadow-lg transition-all bg-primarylight bg-opacity-5 hover:bg-opacity-100">
      <div className="flex items-center gap-1 text-xs">
        <span className=" font-light">
          Platform:
        </span>
        <span className=" font-semibold">
          {donation.platform}
        </span>
      </div>
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
        {/* <a
          href={`?username=${username}&timestamp=${donation.timestamp}&platform=${donation.platform}&review=true`}
          rel="noreferrer"
          className="flex items-center gap-2 text-primary hover:text-primarydark transition-all justify-center"
        >
          <BsClipboardData />
          <span>Summary</span>
        </a> */}
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
                  <span>Download</span>
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
        <div className="flex flex-col justify-center items-center h-96 gap-8">
          <ThemedClimbingBoxLoader size={40} />
          <p className="text-text text-2xl">Loading your donations...</p>
        </div>
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