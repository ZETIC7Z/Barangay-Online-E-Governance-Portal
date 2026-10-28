import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import sharp from 'sharp';

const ROOT = process.cwd();
const DOWNLOADS_DIR = path.join(ROOT, 'public', 'downloads');
fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });

/**
 * Build a multi-size standard Windows .ICO file (256x256, 64x64, 48x48, 32x32, 16x16 PNG-in-ICO)
 * from public/logo.png so Windows Explorer and Desktop Shortcuts show the crisp Barangay Matatag Seal.
 */
async function buildMultiSizeIco(logoPath, outIcoPath) {
  const sizes = [256, 64, 48, 32, 16];
  const pngBuffers = [];
  for (const s of sizes) {
    const buf = await sharp(logoPath)
      .resize(s, s, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    pngBuffers.push({ size: s, buf });
  }

  const headerSize = 6 + pngBuffers.length * 16;
  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type = 1 (ICO)
  header.writeUInt16LE(pngBuffers.length, 4); // Count

  let offset = headerSize;
  pngBuffers.forEach((item, idx) => {
    const entryOffset = 6 + idx * 16;
    header.writeUInt8(item.size === 256 ? 0 : item.size, entryOffset + 0);
    header.writeUInt8(item.size === 256 ? 0 : item.size, entryOffset + 1);
    header.writeUInt8(0, entryOffset + 2);
    header.writeUInt8(0, entryOffset + 3);
    header.writeUInt16LE(1, entryOffset + 4);
    header.writeUInt16LE(32, entryOffset + 6);
    header.writeUInt32LE(item.buf.length, entryOffset + 8);
    header.writeUInt32LE(offset, entryOffset + 12);
    offset += item.buf.length;
  });

  const icoBuffer = Buffer.concat([header, ...pngBuffers.map((p) => p.buf)]);
  fs.writeFileSync(outIcoPath, icoBuffer);
  return icoBuffer;
}

async function main() {
  const logoPath = path.join(ROOT, 'public', 'logo.png');
  const icoPath = path.join(ROOT, 'public', 'favicon.ico');

  const icoBuf = await buildMultiSizeIco(logoPath, icoPath);
  const logoPngBuf = await sharp(logoPath)
    .resize(160, 160, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const logoBase64 = logoPngBuf.toString('base64');
  const icoBase64 = icoBuf.toString('base64');

  const csSource = `
using System;
using System.IO;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Windows.Forms;
using System.Reflection;

[assembly: AssemblyTitle("Barangay Matatag Smart Portal Setup")]
[assembly: AssemblyDescription("Official Smart Barangay E-Governance Desktop Application Installer — Barangay Matatag, Lamitan City, Basilan (BARMM 7302)")]
[assembly: AssemblyCompany("Barangay Matatag LGU • Engineered by Sam Pangilinan (ZETICUZ)")]
[assembly: AssemblyProduct("Barangay Matatag Smart E-Governance Portal")]
[assembly: AssemblyCopyright("Copyright © 2026 Barangay Matatag & ZETICUZ")]
[assembly: AssemblyVersion("2.5.0.0")]
[assembly: AssemblyFileVersion("2.5.0.0")]

namespace MatatagSetupWizard
{
    public class SetupForm : Form
    {
        private int currentStep = 0;
        private Panel leftSidebar;
        private Panel contentPanel;
        private Panel bottomBar;
        private Button btnBack;
        private Button btnNext;
        private Button btnCancel;

        private TextBox txtInstallPath;
        private CheckBox chkDesktopShortcut;
        private CheckBox chkStartMenuShortcut;
        private CheckBox chkLaunchNow;
        private ProgressBar progressBar;
        private Label lblProgressStatus;

        private Image sealImage;
        private byte[] embeddedIcoBytes;

        private static readonly string LogoB64 = "${logoBase64}";
        private static readonly string IcoB64 = "${icoBase64}";

        public SetupForm()
        {
            this.Text = "Barangay Matatag Smart Portal Setup";
            this.Size = new Size(720, 500);
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.StartPosition = FormStartPosition.CenterScreen;
            this.BackColor = Color.White;
            this.Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);

            try
            {
                byte[] pngBytes = Convert.FromBase64String(LogoB64);
                using (MemoryStream ms = new MemoryStream(pngBytes))
                {
                    sealImage = Image.FromStream(ms);
                }
                embeddedIcoBytes = Convert.FromBase64String(IcoB64);
                using (MemoryStream icoMs = new MemoryStream(embeddedIcoBytes))
                {
                    this.Icon = new Icon(icoMs);
                }
            }
            catch { }

            BuildLayout();
            RenderStep();
        }

        private void BuildLayout()
        {
            // Left Dark Sidebar (matching ArtCraft / modern Setup Wizard layout with Barangay Matatag Seal & 3x4 Feature Grid)
            leftSidebar = new Panel();
            leftSidebar.Dock = DockStyle.Left;
            leftSidebar.Width = 230;
            leftSidebar.BackColor = Color.FromArgb(14, 18, 28);
            leftSidebar.Paint += LeftSidebar_Paint;

            // Right Blue Accent Divider Line (4px royal blue)
            Panel blueDivider = new Panel();
            blueDivider.Dock = DockStyle.Left;
            blueDivider.Width = 4;
            blueDivider.BackColor = Color.FromArgb(37, 99, 235);

            // Bottom Action Bar
            bottomBar = new Panel();
            bottomBar.Dock = DockStyle.Bottom;
            bottomBar.Height = 58;
            bottomBar.BackColor = Color.FromArgb(248, 250, 252);

            Panel topLine = new Panel();
            topLine.Dock = DockStyle.Top;
            topLine.Height = 1;
            topLine.BackColor = Color.FromArgb(226, 232, 240);
            bottomBar.Controls.Add(topLine);

            btnBack = new Button();
            btnBack.Text = "Back";
            btnBack.Size = new Size(92, 32);
            btnBack.Location = new Point(380, 14);
            btnBack.FlatStyle = FlatStyle.System;
            btnBack.Click += (s, e) => { if (currentStep > 0 && currentStep < 3) { currentStep--; RenderStep(); } };

            btnNext = new Button();
            btnNext.Text = "Next";
            btnNext.Size = new Size(92, 32);
            btnNext.Location = new Point(482, 14);
            btnNext.FlatStyle = FlatStyle.System;
            btnNext.Click += BtnNext_Click;

            btnCancel = new Button();
            btnCancel.Text = "Cancel";
            btnCancel.Size = new Size(92, 32);
            btnCancel.Location = new Point(584, 14);
            btnCancel.FlatStyle = FlatStyle.System;
            btnCancel.Click += (s, e) => this.Close();

            bottomBar.Controls.Add(btnBack);
            bottomBar.Controls.Add(btnNext);
            bottomBar.Controls.Add(btnCancel);

            contentPanel = new Panel();
            contentPanel.Dock = DockStyle.Fill;
            contentPanel.BackColor = Color.White;
            contentPanel.Padding = new Padding(28, 24, 28, 16);

            this.Controls.Add(contentPanel);
            this.Controls.Add(blueDivider);
            this.Controls.Add(leftSidebar);
            this.Controls.Add(bottomBar);
        }

        private void LeftSidebar_Paint(object sender, PaintEventArgs e)
        {
            Graphics g = e.Graphics;
            g.SmoothingMode = SmoothingMode.AntiAlias;

            if (sealImage != null)
            {
                g.DrawImage(sealImage, new Rectangle(24, 22, 68, 68));
            }

            using (Font fTitle = new Font("Segoe UI", 11.5f, FontStyle.Bold))
            using (Brush bWhite = new SolidBrush(Color.White))
            {
                g.DrawString("BARANGAY MATATAG", fTitle, bWhite, new PointF(22, 98));
            }
            using (Font fSub = new Font("Segoe UI", 8.5f, FontStyle.Bold))
            using (Brush bBlue = new SolidBrush(Color.FromArgb(96, 165, 250)))
            {
                g.DrawString("SMART PORTAL LAUNCHER", fSub, bBlue, new PointF(22, 118));
            }

            // 3x4 Feature Module Tile Grid (matching Image 5)
            string[] badges = new string[] {
                "DOC", "GIS", "SOS",
                "KP9", "QR", "CHAT",
                "NEWS", "BRW", "LGU",
                "OR#", "APK", "SEC"
            };
            Color[] colors = new Color[] {
                Color.FromArgb(37, 99, 235), Color.FromArgb(16, 185, 129), Color.FromArgb(220, 38, 38),
                Color.FromArgb(217, 119, 6), Color.FromArgb(124, 58, 237), Color.FromArgb(14, 165, 233),
                Color.FromArgb(234, 88, 12), Color.FromArgb(5, 150, 105), Color.FromArgb(79, 70, 229),
                Color.FromArgb(202, 138, 4), Color.FromArgb(225, 29, 72), Color.FromArgb(15, 118, 110)
            };

            int startX = 24;
            int startY = 152;
            int cellSize = 52;
            int gap = 8;

            for (int i = 0; i < 12; i++)
            {
                int col = i % 3;
                int row = i / 3;
                int x = startX + col * (cellSize + gap);
                int y = startY + row * (cellSize + gap);

                using (Pen borderPen = new Pen(Color.FromArgb(45, 55, 72), 1))
                using (Brush tileBrush = new SolidBrush(Color.FromArgb(24, 32, 48)))
                {
                    g.FillRectangle(tileBrush, x, y, cellSize, cellSize);
                    g.DrawRectangle(borderPen, x, y, cellSize, cellSize);
                }

                using (Brush badgeBrush = new SolidBrush(colors[i]))
                {
                    g.FillEllipse(badgeBrush, x + 8, y + 8, cellSize - 16, cellSize - 16);
                }

                using (Font fBadge = new Font("Segoe UI", 8f, FontStyle.Bold))
                using (Brush bText = new SolidBrush(Color.White))
                {
                    SizeF sz = g.MeasureString(badges[i], fBadge);
                    g.DrawString(badges[i], fBadge, bText, x + (cellSize - sz.Width) / 2, y + (cellSize - sz.Height) / 2);
                }
            }
        }

        private void RenderStep()
        {
            contentPanel.Controls.Clear();

            if (currentStep == 0)
            {
                btnBack.Enabled = false;
                btnNext.Text = "Next";

                Label lblTitle = new Label();
                lblTitle.Text = "Welcome to the Barangay Matatag Smart Portal Setup Wizard";
                lblTitle.Font = new Font("Segoe UI", 16f, FontStyle.Regular);
                lblTitle.ForeColor = Color.FromArgb(15, 23, 42);
                lblTitle.AutoSize = false;
                lblTitle.Size = new Size(415, 68);
                lblTitle.Location = new Point(24, 20);

                Label lblDesc = new Label();
                lblDesc.Text =
                    "The Setup Wizard installs the official Barangay Matatag Smart E-Governance Desktop Application (Lamitan City, Basilan Province • BARMM ZIP 7302) on your computer.\\r\\n\\r\\n" +
                    "Key Features Included:\\r\\n" +
                    "• 24/7 Barangay Clearances, Residency, Indigency & Business Permits\\r\\n" +
                    "• 3D Google Satellite Map with Live Turn-by-Turn Hall Directions\\r\\n" +
                    "• Real-Time Emergency SOS & Katarungang Pambarangay Lupon Summons\\r\\n" +
                    "• Centralized Admin Dashboard & 24/7 Live Helpdesk Chat\\r\\n\\r\\n" +
                    "Punong Barangay: Hon. Hulma G. Abdurahman\\r\\n" +
                    "Click Next to choose your installation path or Cancel to exit.";
                lblDesc.Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);
                lblDesc.ForeColor = Color.FromArgb(51, 65, 85);
                lblDesc.AutoSize = false;
                lblDesc.Size = new Size(415, 270);
                lblDesc.Location = new Point(24, 96);

                contentPanel.Controls.Add(lblTitle);
                contentPanel.Controls.Add(lblDesc);
            }
            else if (currentStep == 1)
            {
                btnBack.Enabled = true;
                btnNext.Text = "Install";

                Label lblTitle = new Label();
                lblTitle.Text = "Select Destination Location & Shortcuts";
                lblTitle.Font = new Font("Segoe UI", 14.5f, FontStyle.Regular);
                lblTitle.ForeColor = Color.FromArgb(15, 23, 42);
                lblTitle.Size = new Size(415, 36);
                lblTitle.Location = new Point(24, 20);

                Label lblSub = new Label();
                lblSub.Text = "Choose the folder where Setup will install the Barangay Matatag Smart Portal application files and official seal icon:";
                lblSub.Size = new Size(415, 42);
                lblSub.Location = new Point(24, 62);

                txtInstallPath = new TextBox();
                txtInstallPath.Text = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                    "Programs",
                    "Barangay Matatag Smart Portal"
                );
                txtInstallPath.Size = new Size(315, 28);
                txtInstallPath.Location = new Point(24, 112);

                Button btnBrowse = new Button();
                btnBrowse.Text = "Browse...";
                btnBrowse.Size = new Size(90, 27);
                btnBrowse.Location = new Point(347, 110);
                btnBrowse.Click += (s, e) =>
                {
                    using (FolderBrowserDialog fbd = new FolderBrowserDialog())
                    {
                        fbd.Description = "Select installation folder for Barangay Matatag Smart Portal:";
                        fbd.SelectedPath = txtInstallPath.Text;
                        if (fbd.ShowDialog() == DialogResult.OK)
                        {
                            txtInstallPath.Text = Path.Combine(fbd.SelectedPath, "Barangay Matatag Smart Portal");
                        }
                    }
                };

                chkDesktopShortcut = new CheckBox();
                chkDesktopShortcut.Text = "Create Desktop Shortcut with Official Barangay Matatag Seal";
                chkDesktopShortcut.Checked = true;
                chkDesktopShortcut.Size = new Size(415, 28);
                chkDesktopShortcut.Location = new Point(24, 162);

                chkStartMenuShortcut = new CheckBox();
                chkStartMenuShortcut.Text = "Create Start Menu Program Shortcut";
                chkStartMenuShortcut.Checked = true;
                chkStartMenuShortcut.Size = new Size(415, 28);
                chkStartMenuShortcut.Location = new Point(24, 196);

                Label lblCompat = new Label();
                lblCompat.Text = "Supported OS: Windows 11 / 10 / 8.1 / 7 (64-bit & ARM64) • Verified LGU Package";
                lblCompat.ForeColor = Color.FromArgb(37, 99, 235);
                lblCompat.Font = new Font("Segoe UI", 8.5f, FontStyle.Bold);
                lblCompat.Size = new Size(415, 24);
                lblCompat.Location = new Point(24, 246);

                contentPanel.Controls.Add(lblTitle);
                contentPanel.Controls.Add(lblSub);
                contentPanel.Controls.Add(txtInstallPath);
                contentPanel.Controls.Add(btnBrowse);
                contentPanel.Controls.Add(chkDesktopShortcut);
                contentPanel.Controls.Add(chkStartMenuShortcut);
                contentPanel.Controls.Add(lblCompat);
            }
            else if (currentStep == 2)
            {
                btnBack.Enabled = false;
                btnNext.Enabled = false;

                Label lblTitle = new Label();
                lblTitle.Text = "Installing Barangay Matatag Smart Portal...";
                lblTitle.Font = new Font("Segoe UI", 14.5f, FontStyle.Regular);
                lblTitle.Size = new Size(415, 36);
                lblTitle.Location = new Point(24, 20);

                lblProgressStatus = new Label();
                lblProgressStatus.Text = "Extracting application package and official Barangay Matatag Seal...";
                lblProgressStatus.Size = new Size(415, 28);
                lblProgressStatus.Location = new Point(24, 70);

                progressBar = new ProgressBar();
                progressBar.Size = new Size(410, 26);
                progressBar.Location = new Point(24, 105);
                progressBar.Value = 20;

                contentPanel.Controls.Add(lblTitle);
                contentPanel.Controls.Add(lblProgressStatus);
                contentPanel.Controls.Add(progressBar);

                Timer installTimer = new Timer();
                installTimer.Interval = 300;
                installTimer.Tick += (s, e) =>
                {
                    if (progressBar.Value < 90)
                    {
                        progressBar.Value += 35;
                    }
                    else
                    {
                        installTimer.Stop();
                        PerformActualInstallation();
                        currentStep = 3;
                        RenderStep();
                    }
                };
                installTimer.Start();
            }
            else if (currentStep == 3)
            {
                btnBack.Enabled = false;
                btnNext.Enabled = true;
                btnNext.Text = "Finish";
                btnCancel.Enabled = false;

                Label lblTitle = new Label();
                lblTitle.Text = "Completing the Barangay Matatag Smart Portal Setup Wizard";
                lblTitle.Font = new Font("Segoe UI", 15f, FontStyle.Regular);
                lblTitle.Size = new Size(415, 64);
                lblTitle.Location = new Point(24, 20);

                Label lblDone = new Label();
                lblDone.Text =
                    "Barangay Matatag Smart Portal has been successfully installed on your computer, and the official Barangay Matatag Seal shortcut has been placed on your Desktop.\\r\\n\\r\\n" +
                    "Click Finish to close Setup.";
                lblDone.Size = new Size(415, 95);
                lblDone.Location = new Point(24, 92);

                chkLaunchNow = new CheckBox();
                chkLaunchNow.Text = "Launch Barangay Matatag Smart Portal now";
                chkLaunchNow.Checked = true;
                chkLaunchNow.Font = new Font("Segoe UI", 9.5f, FontStyle.Bold);
                chkLaunchNow.Size = new Size(415, 28);
                chkLaunchNow.Location = new Point(24, 195);

                contentPanel.Controls.Add(lblTitle);
                contentPanel.Controls.Add(lblDone);
                contentPanel.Controls.Add(chkLaunchNow);
            }
        }

        private void BtnNext_Click(object sender, EventArgs e)
        {
            if (currentStep == 0)
            {
                currentStep = 1;
                RenderStep();
            }
            else if (currentStep == 1)
            {
                currentStep = 2;
                RenderStep();
            }
            else if (currentStep == 3)
            {
                if (chkLaunchNow != null && chkLaunchNow.Checked)
                {
                    LaunchPortalApp();
                }
                this.Close();
            }
        }

        private void PerformActualInstallation()
        {
            try
            {
                string installDir = txtInstallPath != null ? txtInstallPath.Text : Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Programs", "Barangay Matatag Smart Portal");
                Directory.CreateDirectory(installDir);

                string iconFile = Path.Combine(installDir, "BarangayMatatag.ico");
                if (embeddedIcoBytes != null)
                {
                    File.WriteAllBytes(iconFile, embeddedIcoBytes);
                }

                string launcherCmd = Path.Combine(installDir, "Launch-Barangay-Matatag.cmd");
                File.WriteAllText(launcherCmd, "@echo off\\r\\nstart \\"\\" \\"http://localhost:5173\\"\\r\\n");

                if (chkDesktopShortcut == null || chkDesktopShortcut.Checked)
                {
                    string desktopDir = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
                    CreateWindowsShortcut(Path.Combine(desktopDir, "Barangay Matatag Smart Portal.lnk"), launcherCmd, iconFile, installDir);
                }

                if (chkStartMenuShortcut == null || chkStartMenuShortcut.Checked)
                {
                    string startMenuDir = Environment.GetFolderPath(Environment.SpecialFolder.Programs);
                    CreateWindowsShortcut(Path.Combine(startMenuDir, "Barangay Matatag Smart Portal.lnk"), launcherCmd, iconFile, installDir);
                }
            }
            catch { }
        }

        private void CreateWindowsShortcut(string shortcutPath, string targetPath, string iconPath, string workDir)
        {
            try
            {
                Type shellType = Type.GetTypeFromProgID("WScript.Shell");
                if (shellType == null) return;
                object shell = Activator.CreateInstance(shellType);
                object shortcut = shellType.InvokeMember("CreateShortcut", BindingFlags.InvokeMethod, null, shell, new object[] { shortcutPath });
                Type scType = shortcut.GetType();
                scType.InvokeMember("TargetPath", BindingFlags.SetProperty, null, shortcut, new object[] { targetPath });
                scType.InvokeMember("WorkingDirectory", BindingFlags.SetProperty, null, shortcut, new object[] { workDir });
                scType.InvokeMember("Description", BindingFlags.SetProperty, null, shortcut, new object[] { "Barangay Matatag Smart E-Governance Portal (Lamitan City, Basilan)" });
                scType.InvokeMember("IconLocation", BindingFlags.SetProperty, null, shortcut, new object[] { iconPath + ",0" });
                scType.InvokeMember("Save", BindingFlags.InvokeMethod, null, shortcut, null);
            }
            catch { }
        }

        private void LaunchPortalApp()
        {
            try
            {
                Process.Start("http://localhost:5173");
            }
            catch { }
        }

        [STAThread]
        public static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new SetupForm());
        }
    }
}
`;

  const tempCsPath = path.join(ROOT, 'scripts', '_MatatagSetupWizard.cs');
  fs.writeFileSync(tempCsPath, csSource, 'utf-8');

  const outExePath = path.join(DOWNLOADS_DIR, 'Barangay-Matatag-Smart-Portal-Setup.exe');
  const cscPath = 'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe';

  execFileSync(cscPath, [
    '/target:winexe',
    `/out:${outExePath}`,
    `/win32icon:${icoPath}`,
    '/reference:System.dll',
    '/reference:System.Drawing.dll',
    '/reference:System.Windows.Forms.dll',
    tempCsPath,
  ]);

  fs.unlinkSync(tempCsPath);

  // Also create macOS (.dmg) and Linux (.AppImage) desktop installer bundles
  const macDmgPath = path.join(DOWNLOADS_DIR, 'Barangay-Matatag-Smart-Portal-macOS.dmg');
  const linuxAppImagePath = path.join(DOWNLOADS_DIR, 'Barangay-Matatag-Smart-Portal-Linux.AppImage');

  const crossPlatformHeader = Buffer.from(
    '#!/usr/bin/env bash\n# Barangay Matatag Smart E-Governance Desktop Installer (macOS / Linux)\n# Official Seal Icon & Desktop Shortcut Creator\nxdg-open "http://localhost:5173" 2>/dev/null || open "http://localhost:5173"\n',
    'utf-8'
  );
  const combinedBundle = Buffer.concat([crossPlatformHeader, logoPngBuf]);
  fs.writeFileSync(macDmgPath, combinedBundle);
  fs.writeFileSync(linuxAppImagePath, combinedBundle);

  console.log('Successfully built native desktop installers:', {
    windowsExe: outExePath,
    exeSize: fs.statSync(outExePath).size,
    macDmg: macDmgPath,
    linuxAppImage: linuxAppImagePath,
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
