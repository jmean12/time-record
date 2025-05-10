import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
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
  const [checkOutTime, setCheckOutTime] = useState<Date | null>(null);
  const [progressWidth] = useState(new Animated.Value(0));
  const WORKING_HOURS = 8;

  // 실시간 시계 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 근무 시간 프로그레스 바 업데이트
  useEffect(() => {
    if (isCheckedIn && checkInTime) {
      const elapsedTime = (currentTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
      const progress = Math.min(elapsedTime / WORKING_HOURS, 1);

      Animated.timing(progressWidth, {
        toValue: progress,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [currentTime, isCheckedIn, checkInTime]);

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
    setCheckOutTime(null);

    // 여기에 출근 시간 저장 로직 추가 (API 호출 등)
    console.log("출근 시간:", time.toLocaleString());
  };

  // 퇴근 버튼 클릭 핸들러
  const handleCheckOut = () => {
    const time = new Date();
    setIsCheckedIn(false);
    setCheckOutTime(time);

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

  // 시간만 포맷팅 (초 없이)
  const formatTimeShort = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "오후" : "오전";
    const formattedHours = hours % 12 || 12;

    return `${ampm} ${formattedHours}:${minutes.toString().padStart(2, "0")}`;
  };

  // 근무 시간 계산
  const calculateWorkingHours = () => {
    if (!checkInTime) return "0시간";

    const endTime = checkOutTime || currentTime;
    const hours = (endTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

    const wholeHours = Math.floor(hours);
    const minutes = Math.floor((hours - wholeHours) * 60);

    return `${wholeHours}시간 ${minutes}분`;
  };

  // 남은 근무 시간 계산
  const calculateRemainingTime = () => {
    if (!checkInTime) return "0시간";

    const targetTime = new Date(checkInTime.getTime() + WORKING_HOURS * 60 * 60 * 1000);
    const remaining = (targetTime.getTime() - currentTime.getTime()) / (1000 * 60);

    if (remaining <= 0) return "근무 완료";

    const hours = Math.floor(remaining / 60);
    const minutes = Math.floor(remaining % 60);

    return `${hours}시간 ${minutes}분`;
  };

  // 퇴근 예정 시간
  const getExpectedCheckoutTime = () => {
    if (!checkInTime) return "";
    return formatTimeShort(new Date(checkInTime.getTime() + WORKING_HOURS * 60 * 60 * 1000));
  };

  // 근무 진행률 계산 (%)
  const getWorkProgressPercent = () => {
    if (!checkInTime) return 0;

    const elapsedTime = (currentTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
    const progress = Math.min((elapsedTime / WORKING_HOURS) * 100, 100);

    return Math.round(progress);
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
              checkOutTime ? (
                // 퇴근 완료 상태
                <View style={styles.workSummaryContainer}>
                  <View style={styles.workSummaryHeader}>
                    <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                    <Text style={styles.workSummaryTitle}>근무 완료</Text>
                  </View>

                  <View style={styles.timeInfoContainer}>
                    <View style={styles.timeInfoItem}>
                      <Ionicons name="enter-outline" size={20} color="#4f46e5" />
                      <View>
                        <Text style={styles.timeInfoLabel}>출근</Text>
                        <Text style={styles.timeInfoValue}>
                          {checkInTime ? formatTimeShort(checkInTime) : "-"}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.timeInfoDivider} />

                    <View style={styles.timeInfoItem}>
                      <Ionicons name="exit-outline" size={20} color="#ef4444" />
                      <View>
                        <Text style={styles.timeInfoLabel}>퇴근</Text>
                        <Text style={styles.timeInfoValue}>
                          {checkOutTime ? formatTimeShort(checkOutTime) : "-"}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.workDurationContainer}>
                    <Text style={styles.workDurationLabel}>총 근무 시간</Text>
                    <Text style={styles.workDurationValue}>{calculateWorkingHours()}</Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.button, styles.checkInButton]}
                    onPress={handleCheckIn}
                  >
                    <Ionicons name="enter-outline" size={24} color="white" />
                    <Text style={styles.buttonText}>새로운 근무 시작</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                // 출근 전 상태
                <TouchableOpacity
                  style={[styles.button, styles.checkInButton]}
                  onPress={handleCheckIn}
                >
                  <Ionicons name="enter-outline" size={24} color="white" />
                  <Text style={styles.buttonText}>출근하기</Text>
                </TouchableOpacity>
              )
            ) : (
              // 근무 중 상태
              <View style={styles.checkedInContainer}>
                <View style={styles.checkedInInfo}>
                  <View style={styles.checkedInHeader}>
                    <View style={styles.statusIndicator}>
                      <View style={styles.statusDot} />
                      <Text style={styles.statusText}>근무 중</Text>
                    </View>
                    <Text style={styles.checkedInTime}>
                      {checkInTime ? formatTimeShort(checkInTime) : "-"}에 출근
                    </Text>
                  </View>

                  <View style={styles.progressContainer}>
                    <View style={styles.progressBarBackground}>
                      <Animated.View
                        style={[
                          styles.progressBar,
                          {
                            width: progressWidth.interpolate({
                              inputRange: [0, 1],
                              outputRange: ["0%", "100%"],
                            }),
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.progressText}>{getWorkProgressPercent()}% 완료</Text>
                  </View>

                  <View style={styles.workInfoGrid}>
                    <View style={styles.workInfoItem}>
                      <Ionicons name="time-outline" size={18} color="#4f46e5" />
                      <Text style={styles.workInfoLabel}>근무 시간</Text>
                      <Text style={styles.workInfoValue}>{calculateWorkingHours()}</Text>
                    </View>

                    <View style={styles.workInfoItem}>
                      <Ionicons name="hourglass-outline" size={18} color="#f59e0b" />
                      <Text style={styles.workInfoLabel}>남은 시간</Text>
                      <Text style={styles.workInfoValue}>{calculateRemainingTime()}</Text>
                    </View>

                    <View style={styles.workInfoItem}>
                      <Ionicons name="exit-outline" size={18} color="#ef4444" />
                      <Text style={styles.workInfoLabel}>퇴근 예정</Text>
                      <Text style={styles.workInfoValue}>{getExpectedCheckoutTime()}</Text>
                    </View>

                    <View style={styles.workInfoItem}>
                      <Ionicons name="calendar-outline" size={18} color="#10b981" />
                      <Text style={styles.workInfoLabel}>목표 시간</Text>
                      <Text style={styles.workInfoValue}>{WORKING_HOURS}시간</Text>
                    </View>
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
    backgroundColor: "#f0f9ff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#bae6fd",
  },
  checkedInHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#4f46e5",
    marginRight: 6,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4f46e5",
  },
  checkedInTime: {
    fontSize: 14,
    color: "#4b5563",
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 4,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#4f46e5",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "right",
  },
  workInfoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  workInfoItem: {
    width: "48%",
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: "center",
  },
  workInfoLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  workInfoValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1f2937",
    marginTop: 2,
  },
  workSummaryContainer: {
    backgroundColor: "#f0fdf4",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#bbf7d0",
    marginBottom: 16,
  },
  workSummaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  workSummaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#10b981",
    marginLeft: 8,
  },
  timeInfoContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  timeInfoItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeInfoLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginLeft: 8,
  },
  timeInfoValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
    marginLeft: 8,
  },
  timeInfoDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#e5e7eb",
  },
  workDurationContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  workDurationLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  workDurationValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#10b981",
  },
});
