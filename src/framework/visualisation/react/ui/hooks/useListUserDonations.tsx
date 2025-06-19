import { useEffect, useState } from "react";
import { ListUserDonationResponse, listUserDonations } from "../../../../../lib/donations-adapter";

export default function useListUserDonations(username: string) {
  const [data, setData] = useState<ListUserDonationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const data = await listUserDonations(username);
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