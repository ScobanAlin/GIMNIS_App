import { StyleSheet } from "react-native";


export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
  },
  button: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#f7f7f7",
    width: 220,
    marginVertical: 6,
  },
  buttonText: {
    fontSize: 18,
    textAlign: "center",
  },
  error: {
    color: "crimson",
    marginTop: 10,
  },
});