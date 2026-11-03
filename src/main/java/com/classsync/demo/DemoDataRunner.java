package com.classsync.demo;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("demo")
public class DemoDataRunner implements CommandLineRunner {

    private final DemoDataSeeder seeder;

    public DemoDataRunner(DemoDataSeeder seeder) {
        this.seeder = seeder;
    }

    @Override
    public void run(String... args) {
        seeder.seed();
    }
}
