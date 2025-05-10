import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function HomeScreen() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationName, setLocationName] = useState("위치 확인 중...");
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);

  // 실시간 시계 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 위치 정보 가져오기
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationName("위치 권한이 필요합니다");
        setIsLoading(false);
        return;
      }

      try {
        const location = await Location.getCurrentPositionAsync({});
        setLocation(location);

        // 위치 정보로 주소 가져오기
        const geocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (geocode.length > 0) {
          const address = geocode[0];
          setLocationName(
            `${address.city || ""} ${address.district || ""} ${address.street || ""}`
          );
        }
      } catch (error) {
        setLocationName("위치를 가져올 수 없습니다");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // 출근 버튼 클릭 핸들러
  const handleCheckIn = () => {
    const time = new Date();
    setIsCheckedIn(true);
    setCheckInTime(time);

    // 여기에 출근 시간 저장 로직 추가 (API 호출 등)
    console.log("출근 시간:", time.toLocaleString());
  };

  // 퇴근 버튼 클릭 핸들러
  const handleCheckOut = () => {
    const time = new Date();
    setIsCheckedIn(false);

    // 여기에 퇴근 시간 저장 로직 추가 (API 호출 등)
    console.log("퇴근 시간:", time.toLocaleString());
    console.log(
      "근무 시간:",
      checkInTime
        ? ((time.getTime() - checkInTime.getTime()) / (1000 * 60 * 60)).toFixed(2) + "시간"
        : "알 수 없음"
    );
  };

  // 날짜 포맷팅
  const formatDate = (date: Date) => {
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = days[date.getDay()];

    return `${year}년 ${month}월 ${day}일 (${dayOfWeek})`;
  };

  // 시간 포맷팅
  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const ampm = hours >= 12 ? "오후" : "오전";
    const formattedHours = hours % 12 || 12;

    return `${ampm} ${formattedHours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>{formatDate(currentTime)}</Text>
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={18} color="#666" />
            <Text style={styles.locationText}>{isLoading ? "위치 확인 중..." : locationName}</Text>
          </View>
        </View>

        <View style={styles.clockContainer}>
          <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4f46e5" />
            <Text style={styles.loadingText}>위치 정보를 가져오는 중...</Text>
          </View>
        ) : (
          <View style={styles.actionContainer}>
            {!isCheckedIn ? (
              <TouchableOpacity
                style={[styles.button, styles.checkInButton]}
                onPress={handleCheckIn}
              >
                <Ionicons name="enter-outline" size={24} color="white" />
                <Text style={styles.buttonText}>출근하기</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.checkedInContainer}>
                <View style={styles.checkedInInfo}>
                  <View
                    style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color="#10b981"
                      style={{ marginRight: 4 }}
                    />
                    <Text style={styles.checkedInText}>
                      {checkInTime?.toLocaleTimeString("ko-KR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      에 출근했습니다
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.button, styles.checkOutButton]}
                  onPress={handleCheckOut}
                >
                  <Ionicons name="exit-outline" size={24} color="white" />
                  <Text style={styles.buttonText}>퇴근하기</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: "space-between",
  },
  dateContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  dateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  locationText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
  },
  clockContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 40,
  },
  timeText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#1f2937",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6b7280",
  },
  actionContainer: {
    marginBottom: 40,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  checkInButton: {
    backgroundColor: "#4f46e5",
  },
  checkOutButton: {
    backgroundColor: "#ef4444",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
  checkedInContainer: {
    gap: 16,
  },
  checkedInInfo: {
    backgroundColor: "#ecfdf5",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d1fae5",
    marginBottom: 8,
  },
  checkedInText: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    color: "#047857",
    textAlign: "center",
    gap: 10,
  },
});
