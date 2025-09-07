import React, { useState, useEffect } from "react";
import { View, Text, Button, ScrollView, Alert, Dimensions } from "react-native";
import * as Notifications from "expo-notifications";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { LineChart } from "react-native-chart-kit";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";

export default function App() {
  const [form, setForm] = useState({ skin: "", pain: "", fluid: "" });
  const [records, setRecords] = useState([]);
  const [alarmTime, setAlarmTime] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [alarmId, setAlarmId] = useState(null);

  useEffect(() => {
    Notifications.requestPermissionsAsync();
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }, []);

  const setAlarm = async () => {
    if (alarmId) {
      Notifications.cancelScheduledNotificationAsync(alarmId);
    }
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Alarm Plester",
        body: "Sudahkah Anda mengganti plester?",
      },
      trigger: {
        hour: alarmTime.getHours(),
        minute: alarmTime.getMinutes(),
        repeats: true,
      },
    });
    setAlarmId(id);
    Alert.alert("Alarm disetel", `Jam ${alarmTime.getHours()}:${alarmTime.getMinutes()}`);
  };

  const stopAlarm = () => {
    if (alarmId) {
      Notifications.cancelScheduledNotificationAsync(alarmId);
      setAlarmId(null);
      Alert.alert("Alarm dihentikan");
    }
  };

  const saveForm = () => {
    setRecords([...records, { ...form, date: new Date().toLocaleString() }]);
    setForm({ skin: "", pain: "", fluid: "" });
    Alert.alert("Data tersimpan");
  };

  const exportPDF = async () => {
    let html = `<h1>Data Monitoring Luka</h1><table border='1'><tr><th>Tanggal</th><th>Kulit</th><th>Nyeri</th><th>Cairan</th></tr>`;
    records.forEach((r) => {
      html += `<tr><td>${r.date}</td><td>${r.skin}</td><td>${r.pain}</td><td>${r.fluid}</td></tr>`;
    });
    html += `</table>`;
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri);
  };

  return (
    <ScrollView style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold" }}>Plester Hydrogel App</Text>

      {/* Alarm */}
      <View style={{ marginVertical: 20 }}>
        <Button title="Setel Alarm" onPress={() => setShowPicker(true)} />
        {showPicker && (
          <DateTimePicker
            value={alarmTime}
            mode="time"
            onChange={(e, selected) => {
              setShowPicker(false);
              if (selected) setAlarmTime(selected);
            }}
          />
        )}
        <Button title="Konfirmasi Alarm" onPress={setAlarm} />
        {alarmId && <Button title="Stop Alarm" onPress={stopAlarm} />}
      </View>

      {/* Form */}
      <View style={{ marginVertical: 20 }}>
        <Text style={{ fontSize: 18 }}>Form Monitoring</Text>
        <Text>Kondisi Kulit</Text>
        <Picker
          selectedValue={form.skin}
          onValueChange={(val) => setForm({ ...form, skin: val })}
        >
          <Picker.Item label="Sangat Kering" value="Sangat Kering" />
          <Picker.Item label="Kering" value="Kering" />
          <Picker.Item label="Sedikit Lembab" value="Sedikit Lembab" />
          <Picker.Item label="Lembab" value="Lembab" />
          <Picker.Item label="Sangat Lembab" value="Sangat Lembab" />
        </Picker>

        <Text>Tingkat Nyeri</Text>
        <Picker
          selectedValue={form.pain}
          onValueChange={(val) => setForm({ ...form, pain: val })}
        >
          <Picker.Item label="Sangat Nyeri" value="Sangat Nyeri" />
          <Picker.Item label="Nyeri" value="Nyeri" />
          <Picker.Item label="Sedikit Nyeri" value="Sedikit Nyeri" />
          <Picker.Item label="Tidak Sama Sekali" value="Tidak Sama Sekali" />
        </Picker>

        <Text>Ada Cairan?</Text>
        <Picker
          selectedValue={form.fluid}
          onValueChange={(val) => setForm({ ...form, fluid: val })}
        >
          <Picker.Item label="Ada Cairan" value="Ada Cairan" />
          <Picker.Item label="Ada Sedikit Cairan" value="Ada Sedikit Cairan" />
          <Picker.Item label="Tidak ada Cairan" value="Tidak ada Cairan" />
        </Picker>

        <Button title="Simpan" onPress={saveForm} />
      </View>

      {/* Grafik */}
      {records.length > 0 && (
        <LineChart
          data={{
            labels: records.map((r, i) => `${i + 1}`),
            datasets: [{ data: records.map((r) => iMap[r.pain] || 0) }],
          }}
          width={Dimensions.get("window").width - 40}
          height={220}
          yAxisLabel=""
          chartConfig={{
            backgroundColor: "#e26a00",
            backgroundGradientFrom: "#fb8c00",
            backgroundGradientTo: "#ffa726",
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(255,255,255,${opacity})`,
          }}
        />
      )}

      <Button title="Ekspor Data ke PDF" onPress={exportPDF} />
    </ScrollView>
  );
}

// Mapping nilai pain jadi angka biar bisa ditaruh di grafik
const iMap = {
  "Sangat Nyeri": 5,
  "Nyeri": 4,
  "Sedikit Nyeri": 3,
  "Tidak Sama Sekali": 0,
};
