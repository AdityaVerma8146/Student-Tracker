package com.syllabustracker.repository;

import com.syllabustracker.entity.OtpEntity;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OtpRepository extends CrudRepository<OtpEntity, String> {
}
