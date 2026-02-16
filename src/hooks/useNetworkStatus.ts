import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";

type NetworkStatus = {
  isOnline: boolean;
  isInternetReachable: boolean | null;
};

export const useNetworkStatus = (): NetworkStatus => {
  const [isOnline, setIsOnline] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;

    const syncState = (nextState: { isConnected: boolean | null; isInternetReachable: boolean | null }) => {
      if (!mounted) return;
      const nextOnline = Boolean(nextState.isConnected ?? false);
      const reachable = nextState.isInternetReachable;
      setIsOnline(reachable == null ? nextOnline : nextOnline && reachable);
      setIsInternetReachable(reachable);
    };

    const unsubscribe = NetInfo.addEventListener((state) => {
      syncState({
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
      });
    });

    void NetInfo.fetch().then((state) =>
      syncState({
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
      })
    );

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return { isOnline, isInternetReachable };
};

