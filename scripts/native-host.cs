using System;
using System.IO;
using System.Text;
using System.Diagnostics;

class NativeHost
{
    static void Main(string[] args)
    {
        try
        {
            // Read 4-byte message length from standard input
            Stream stdin = Console.OpenStandardInput();
            byte[] lenBytes = new byte[4];
            int bytesRead = stdin.Read(lenBytes, 0, 4);

            if (bytesRead == 4)
            {
                int msgLen = BitConverter.ToInt32(lenBytes, 0);
                if (msgLen > 0 && msgLen < 1024 * 1024)
                {
                    byte[] msgBuffer = new byte[msgLen];
                    stdin.Read(msgBuffer, 0, msgLen);
                }
            }

            // Locate ytdlp-server.js in the scripts folder
            string baseDir = AppDomain.CurrentDomain.BaseDirectory;
            string serverScript = Path.Combine(baseDir, "ytdlp-server.js");
            if (!File.Exists(serverScript))
            {
                serverScript = Path.Combine(Directory.GetParent(baseDir).FullName, "scripts", "ytdlp-server.js");
            }

            // Launch node ytdlp-server.js completely hidden with zero console window
            ProcessStartInfo psi = new ProcessStartInfo("node", "\"" + serverScript + "\"")
            {
                CreateNoWindow = true,
                UseShellExecute = false,
                WindowStyle = ProcessWindowStyle.Hidden,
                WorkingDirectory = Path.GetDirectoryName(serverScript)
            };
            Process.Start(psi);

            // Respond to Chrome Native Messaging: 4 bytes length + UTF-8 JSON
            string json = "{\"ok\":true,\"status\":\"started\",\"port\":8989}";
            byte[] jsonBytes = Encoding.UTF8.GetBytes(json);
            byte[] header = BitConverter.GetBytes(jsonBytes.Length);

            Stream stdout = Console.OpenStandardOutput();
            stdout.Write(header, 0, 4);
            stdout.Write(jsonBytes, 0, jsonBytes.Length);
            stdout.Flush();
        }
        catch (Exception ex)
        {
            try
            {
                string errJson = "{\"ok\":false,\"error\":\"" + ex.Message.Replace("\"", "'") + "\"}";
                byte[] jsonBytes = Encoding.UTF8.GetBytes(errJson);
                byte[] header = BitConverter.GetBytes(jsonBytes.Length);

                Stream stdout = Console.OpenStandardOutput();
                stdout.Write(header, 0, 4);
                stdout.Write(jsonBytes, 0, jsonBytes.Length);
                stdout.Flush();
            }
            catch { }
        }
    }
}
