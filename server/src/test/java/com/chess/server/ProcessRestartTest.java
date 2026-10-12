package com.chess.server;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import java.nio.file.*;
import java.util.concurrent.TimeUnit;
import static org.junit.jupiter.api.Assertions.*;

class ProcessRestartTest {
    @TempDir Path directory;

    @Test void activeAndCompletedGamesSurviveSeparateJvmLifetimes() throws Exception {
        String java = Path.of(System.getProperty("java.home"), "bin", "java").toString();
        String classpath = System.getProperty("surefire.test.class.path", System.getProperty("java.class.path"));
        for (String phase : new String[]{"create", "resume", "finished"}) {
            Path output = directory.resolve(phase + ".log");
            Process child = new ProcessBuilder(java, "-cp", classpath, RecoveryProcess.class.getName(), phase, directory.toString())
                    .redirectErrorStream(true).redirectOutput(output.toFile()).start();
            try {
                assertTrue(child.waitFor(45, TimeUnit.SECONDS), "Recovery process timed out: " + phase);
                assertEquals(0, child.exitValue(), () -> {
                    try { return phase + ": " + Files.readString(output); }
                    catch (Exception error) { return phase + ": unreadable process log"; }
                });
            } finally {
                if (child.isAlive()) { child.destroyForcibly(); child.waitFor(5, TimeUnit.SECONDS); }
            }
        }
    }
}
